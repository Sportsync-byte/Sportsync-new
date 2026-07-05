import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IndoorCricketMatchState, RunValue } from '@sportsync/shared';
import { SOCKET_EVENTS } from '@sportsync/shared';
import { Scoreboard } from './components/Scoreboard';
import { RunPad } from './components/RunPad';
import { ExtrasPad } from './components/ExtrasPad';
import { ActionBar } from './components/ActionBar';

const RUN_VALUES: RunValue[] = [0, 1, 2, 3, 4, 5, 6, 7];

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchState, setMatchState] = useState<IndoorCricketMatchState | null>(null);
  const [matchId, setMatchId] = useState('');
  const [connected, setConnected] = useState(false);

  const connectToMatch = useCallback(() => {
    if (!matchId.trim()) return;

    const newSocket = io('/', { transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit(SOCKET_EVENTS.MATCH_JOIN, matchId);
    });

    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on(SOCKET_EVENTS.MATCH_STATE, (state: IndoorCricketMatchState) => {
      setMatchState(state);
    });

    setSocket(newSocket);
  }, [matchId]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const recordRun = (runs: RunValue) => {
    if (!socket || !matchId) return;
    socket.emit(SOCKET_EVENTS.MATCH_BALL, { matchId, ball: { runs } });
  };

  const recordExtra = (type: string, runs: number) => {
    if (!socket || !matchId) return;
    socket.emit(SOCKET_EVENTS.MATCH_BALL, {
      matchId,
      ball: { runs: 0, extra: { type, runs } },
    });
  };

  const undo = () => {
    if (!socket || !matchId) return;
    socket.emit(SOCKET_EVENTS.MATCH_UNDO, matchId);
  };

  if (!socket) {
    return (
      <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>SportSync Scorer</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Enter a match ID to begin scoring. Works offline — syncs when connection returns.
        </p>
        <input
          type="text"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          placeholder="Match ID"
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '1.1rem',
            marginBottom: '1rem',
          }}
        />
        <button
          onClick={connectToMatch}
          disabled={!matchId.trim()}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'var(--accent)',
            color: '#0a0e12',
            fontWeight: 700,
            fontSize: '1.1rem',
            borderRadius: 10,
          }}
        >
          Connect to Match
        </button>
      </div>
    );
  }

  const innings = matchState?.innings[matchState.battingTeamIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700 }}>SportSync Scorer</span>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 999,
            background: connected ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)',
            color: connected ? 'var(--accent)' : 'var(--danger)',
          }}
        >
          {connected ? 'Connected' : 'Offline'}
        </span>
      </header>

      {matchState && innings ? (
        <>
          <Scoreboard state={matchState} />
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <RunPad values={RUN_VALUES} onRun={recordRun} />
            <ExtrasPad onExtra={recordExtra} />
            <ActionBar onUndo={undo} canUndo={(innings.ballHistory?.length ?? 0) > 0} />
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          Loading match...
        </div>
      )}
    </div>
  );
}
