import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Player } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { useFootballSocket } from '../hooks/useFootballSocket';
import { TimerBar } from '../components/TimerBar';

export function FootballScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { connected, matchState, startMatch, recordGoal, endHalf, emitTimer } = useFootballSocket(matchId ?? null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [scoringTeam, setScoringTeam] = useState<'home' | 'away'>('home');
  const [selectedScorer, setSelectedScorer] = useState('');

  useEffect(() => {
    if (!matchId) return;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { venueId?: string };
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

  if (!matchId || !matchState) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Connecting...</div>;
  }

  const homeName = teamNames[matchState.homeTeamId] || 'Home';
  const awayName = teamNames[matchState.awayTeamId] || 'Away';
  const teamId = scoringTeam === 'home' ? matchState.homeTeamId : matchState.awayTeamId;
  const teamPlayers = players.filter((p) => p.teamIds.includes(teamId));

  if (matchState.status === 'completed') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Full Time</h1>
        <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem' }}>
          {homeName} {matchState.homeScore} – {matchState.awayScore} {awayName}
        </p>
      </div>
    );
  }

  if (matchState.status === 'not-started') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>{homeName} vs {awayName}</h1>
        <button onClick={startMatch} style={{ padding: '1rem 2rem', background: 'var(--accent)', color: '#0a0e12', fontWeight: 700, borderRadius: 10, fontSize: '1.1rem' }}>
          Kick Off
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '0.75rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700 }}>Football Scorer · Half {matchState.currentHalf}</span>
        <span style={{ fontSize: '0.75rem', color: connected ? 'var(--accent)' : 'var(--danger)' }}>{connected ? 'Connected' : 'Offline'}</span>
      </header>

      <div style={{ padding: '1rem', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{homeName}</div>
            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{matchState.homeScore}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{awayName}</div>
            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{matchState.awayScore}</div>
          </div>
        </div>
      </div>

      {matchState.status === 'live' && (
        <TimerBar
          seconds={matchState.timerSeconds}
          running={matchState.timerRunning}
          expired={matchState.timerExpired}
          onStart={() => emitTimer(matchState.timerSeconds, true)}
          onPause={() => emitTimer(matchState.timerSeconds, false)}
          onReset={() => emitTimer(matchState.format.halfDurationSeconds, false)}
        />
      )}

      {matchState.status === 'half-time' ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Half time</h2>
          <button onClick={startMatch} style={{ marginTop: '1rem', padding: '1rem 2rem', background: 'var(--accent)', color: '#0a0e12', fontWeight: 700, borderRadius: 10 }}>
            Start Half {matchState.currentHalf}
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setScoringTeam('home')} style={{ flex: 1, padding: '0.75rem', background: scoringTeam === 'home' ? 'var(--accent)' : 'var(--surface-elevated)', borderRadius: 8, fontWeight: 600 }}>
              {homeName} goal
            </button>
            <button onClick={() => setScoringTeam('away')} style={{ flex: 1, padding: '0.75rem', background: scoringTeam === 'away' ? 'var(--accent)' : 'var(--surface-elevated)', borderRadius: 8, fontWeight: 600 }}>
              {awayName} goal
            </button>
          </div>
          <select value={selectedScorer} onChange={(e) => setSelectedScorer(e.target.value)} style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <option value="">Select scorer</option>
            {teamPlayers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>
          <button
            disabled={!selectedScorer}
            onClick={() => { recordGoal(teamId, selectedScorer); setSelectedScorer(''); }}
            style={{ padding: '1.5rem', fontSize: '1.5rem', fontWeight: 800, background: 'var(--accent)', color: '#0a0e12', borderRadius: 12 }}
          >
            GOAL
          </button>
          <button onClick={endHalf} style={{ padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>End Half</button>
        </div>
      )}
    </div>
  );
}
