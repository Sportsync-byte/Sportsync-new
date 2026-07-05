import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { RunValue, DismissalType, Player } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { useMatchSocket } from '../hooks/useMatchSocket';
import { useInningsTimer } from '../hooks/useInningsTimer';
import { TimerBar } from '../components/TimerBar';
import { Scoreboard } from '../components/Scoreboard';
import { RunPad } from '../components/RunPad';
import { ExtrasPad } from '../components/ExtrasPad';
import { ActionBar } from '../components/ActionBar';
import { PlayerPicker } from '../components/PlayerPicker';
import { WicketModal } from '../components/WicketModal';

const RUN_VALUES: RunValue[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function ScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { connected, matchState, emitBall, emitSetup, emitUndo, emitTimer } = useMatchSocket(matchId ?? null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [showWicket, setShowWicket] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { venueId?: string; state?: { innings: { teamId: string }[] } };
      if (match.venueId) {
        const [playerList, teamList] = await Promise.all([
          api.players.list(match.venueId),
          api.teams.list(match.venueId),
        ]);
        setPlayers(playerList);
        setTeamNames(Object.fromEntries(teamList.map((t) => [t.id, t.name])));
      }
    });
  }, [matchId]);

  const timer = useInningsTimer({
    matchId: matchId ?? '',
    matchState,
    connected,
    emitTimer,
  });

  if (!matchId || !matchState) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to match...</div>;
  }

  const innings = matchState.innings[matchState.battingTeamIndex];
  const bowlingTeamId = matchState.innings[matchState.battingTeamIndex === 0 ? 1 : 0].teamId;
  const battingTeamId = innings.teamId;
  const battingPlayers = players.filter((p) => p.teamIds.includes(battingTeamId));
  const bowlingPlayers = players.filter((p) => p.teamIds.includes(bowlingTeamId));

  if (matchState.status === 'completed') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem' }}>Match Complete</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          {matchState.winnerTeamId
            ? `${teamNames[matchState.winnerTeamId] || 'Winner'} wins!`
            : 'Match tied'}
        </p>
        <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
          {matchState.innings[0].totalRuns}/{matchState.innings[0].wickets} – {matchState.innings[1].totalRuns}/{matchState.innings[1].wickets}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '0.75rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700 }}>SportSync Scorer</span>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 999, background: connected ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)', color: connected ? 'var(--accent)' : 'var(--danger)' }}>
          {connected ? 'Connected' : 'Offline — queuing'}
        </span>
      </header>

      <Scoreboard state={matchState} teamNames={teamNames} playerNames={Object.fromEntries(players.map((p) => [p.id, p.displayName]))} />

      {!matchState.pendingPrompt && matchState.status !== 'not-started' && (
        <TimerBar
          seconds={innings.timerSeconds}
          running={innings.timerRunning}
          expired={innings.timerExpired}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
        />
      )}

      {matchState.pendingPrompt === 'batters' && (
        <PlayerPicker
          title="Select opening batters"
          players={battingPlayers}
          count={2}
          onSelect={(ids) => emitSetup({ matchId, action: 'set-batters', strikerId: ids[0], nonStrikerId: ids[1] })}
        />
      )}

      {matchState.pendingPrompt === 'bowler' && (
        <PlayerPicker
          title="Select bowler"
          players={bowlingPlayers}
          count={1}
          onSelect={(ids) => emitSetup({ matchId, action: 'set-bowler', bowlerId: ids[0] })}
        />
      )}

      {matchState.pendingPrompt === 'partnership' && (
        <PlayerPicker
          title={`Select batters for partnership ${innings.currentPartnership + 1}`}
          players={battingPlayers.filter((p) => !matchState.dismissedBatters.includes(p.id))}
          count={2}
          onSelect={(ids) => emitSetup({ matchId, action: 'next-partnership', strikerId: ids[0], nonStrikerId: ids[1] })}
        />
      )}

      {!matchState.pendingPrompt && (
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <RunPad values={RUN_VALUES} onRun={(runs) => emitBall({ runs })} />
          <ExtrasPad onExtra={(type, runs) => emitBall({ runs: 0, extra: { type, runs } })} />
          <ActionBar
            onUndo={emitUndo}
            onWicket={() => setShowWicket(true)}
            canUndo={(innings.ballHistory?.length ?? 0) > 0}
          />
        </div>
      )}

      {showWicket && (
        <WicketModal
          batters={battingPlayers.filter((p) => [innings.strikerId, innings.nonStrikerId].includes(p.id))}
          fielders={bowlingPlayers}
          onConfirm={(dismissal: { type: DismissalType; batterId: string; fielderId?: string }) => {
            emitBall({ runs: 0, dismissal });
            setShowWicket(false);
          }}
          onCancel={() => setShowWicket(false)}
        />
      )}
    </div>
  );
}
