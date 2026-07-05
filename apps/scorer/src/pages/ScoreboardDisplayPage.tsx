import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { getScoreboardDisplay } from '@sportsync/sport-rules';

export function ScoreboardDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<IndoorCricketMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!matchId) return;

    let socket: ReturnType<typeof io> | null = null;

    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: IndoorCricketMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const [teams, players] = await Promise.all([
          api.teams.list(match.venueId),
          api.players.list(match.venueId),
        ]);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
        setPlayerNames(Object.fromEntries(players.map((p) => [p.id, p.displayName])));
      }
    });

    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: IndoorCricketMatchState) => setState(s));

    return () => {
      socket?.disconnect();
    };
  }, [matchId]);

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0e12', color: '#fff' }}>
        Loading scoreboard...
      </div>
    );
  }

  const display = getScoreboardDisplay(state);
  const batting = display.battingTeam;
  const bowling = display.bowlingTeam;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0e12 0%, #141b24 100%)', color: '#fff', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '1rem', color: '#7d8fa3', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SportSync Live</div>
        {state.status === 'completed' && (
          <div style={{ fontSize: '1.5rem', color: '#00d4aa', marginTop: '0.5rem' }}>Match Complete</div>
        )}
      </div>

      {/* Bowling team (top) */}
      <div style={{ opacity: 0.7, marginBottom: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{teamNames[bowling.teamId] || bowling.teamId}</div>
        <div style={{ fontSize: '3rem', fontWeight: 800 }}>{bowling.total}/{bowling.wickets}</div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          {bowling.partnerships.map((p) => (
            <span key={p.partnership} style={{ fontSize: '0.9rem', color: '#7d8fa3' }}>P{p.partnership}: {p.runs}</span>
          ))}
        </div>
      </div>

      {/* Batting team (bottom, highlighted) */}
      <div style={{ padding: '2rem', background: 'rgba(0,212,170,0.1)', borderRadius: 16, border: '2px solid rgba(0,212,170,0.3)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{teamNames[batting.teamId] || batting.teamId}</div>
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1 }}>{batting.total}/{batting.wickets}</div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Batter</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{playerNames[display.current.strikerId] || '—'} *</div>
            <div style={{ fontSize: '1.1rem' }}>{playerNames[display.current.nonStrikerId] || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Bowler</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{playerNames[display.current.bowlerId] || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Over</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{display.current.over}.{display.current.ball}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Partnership</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{display.current.partnership}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
