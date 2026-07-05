import type { IndoorCricketMatchState } from '@sportsync/shared';

interface ScoreboardProps {
  state: IndoorCricketMatchState;
}

export function Scoreboard({ state }: ScoreboardProps) {
  const batting = state.innings[state.battingTeamIndex];
  const bowling = state.innings[state.battingTeamIndex === 0 ? 1 : 0];

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <TeamRow
        label="Bowling"
        teamId={bowling.teamId}
        total={bowling.totalRuns}
        wickets={bowling.wickets}
        dimmed
      />
      <TeamRow
        label="Batting"
        teamId={batting.teamId}
        total={batting.totalRuns}
        wickets={batting.wickets}
        current
        over={batting.currentOver}
        ball={batting.ballsInOver}
        partnership={batting.currentPartnership}
        timerSeconds={batting.timerSeconds}
      />
    </div>
  );
}

function TeamRow({
  label,
  teamId,
  total,
  wickets,
  dimmed,
  current,
  over,
  ball,
  partnership,
  timerSeconds,
}: {
  label: string;
  teamId: string;
  total: number;
  wickets: number;
  dimmed?: boolean;
  current?: boolean;
  over?: number;
  ball?: number;
  partnership?: number;
  timerSeconds?: number;
}) {
  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        opacity: dimmed ? 0.6 : 1,
        background: current ? 'var(--accent-dim)' : 'transparent',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{teamId || 'Team'}</div>
        {current && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Partnership {partnership} · {over}.{ball}
            {timerSeconds !== undefined && ` · ${formatTimer(timerSeconds)}`}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
          {total}/{wickets}
        </div>
      </div>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
