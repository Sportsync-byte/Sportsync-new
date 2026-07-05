import type { LiveMatchSummary } from '@sportsync/shared';

const SCORER_URL = import.meta.env.VITE_SCORER_URL || 'http://localhost:5174';

export function formatLiveScore(m: LiveMatchSummary): { home: string; away: string } {
  if (m.sport === 'indoor-netball' || m.sport === 'indoor-football' || m.sport === 'basketball' || m.sport === 'touch-rugby') {
    return { home: String(m.homeScore), away: String(m.awayScore) };
  }
  return {
    home: `${m.homeScore}/${m.homeWickets ?? 0}`,
    away: `${m.awayScore}/${m.awayWickets ?? 0}`,
  };
}

export function liveStatusLabel(m: LiveMatchSummary): string {
  if (m.sport === 'indoor-netball') {
    if (m.status === 'quarter-break') return 'Quarter break';
    if (m.status === 'not-started') return 'Not started';
    return `Q${m.quarter ?? 1}`;
  }
  if (m.sport === 'indoor-football') {
    if (m.status === 'half-time') return 'Half time';
    if (m.status === 'not-started') return 'Not started';
    return `H${m.quarter ?? 1}`;
  }
  if (m.sport === 'touch-rugby') {
    if (m.status === 'half-time') return 'Half time';
    if (m.status === 'not-started') return 'Not started';
    return `H${m.quarter ?? 1}`;
  }
  if (m.sport === 'basketball') {
    if (m.status === 'quarter-break') return 'Quarter break';
    if (m.status === 'not-started') return 'Not started';
    return `Q${m.quarter ?? 1}`;
  }
  if (m.status === 'not-started') return 'Not started';
  if (m.over != null) return `Over ${m.over}.${m.ball ?? 0}`;
  return 'Live';
}

interface LiveScoreCardProps {
  match: LiveMatchSummary;
  compact?: boolean;
}

export function LiveScoreCard({ match: m, compact }: LiveScoreCardProps) {
  const scores = formatLiveScore(m);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: compact ? '0.35rem' : '0.5rem' }}>
        <div>
          <span className="badge live" style={{ marginRight: '0.5rem' }}>Live</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {m.competitionName}{m.courtName ? ` · ${m.courtName}` : ''}
          </span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{liveStatusLabel(m)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: compact ? '0.9rem' : '1rem' }}>{m.homeTeamName}</div>
          <div style={{ fontSize: compact ? '1.35rem' : '1.75rem', fontWeight: 800 }}>{scores.home}</div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>vs</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: compact ? '0.9rem' : '1rem' }}>{m.awayTeamName}</div>
          <div style={{ fontSize: compact ? '1.35rem' : '1.75rem', fontWeight: 800 }}>{scores.away}</div>
        </div>
      </div>
      {!compact && (
        <a
          href={`${SCORER_URL}/display/${m.matchId}`}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem' }}
        >
          Open scoreboard display →
        </a>
      )}
    </div>
  );
}

export function groupMatchesByCourt(matches: LiveMatchSummary[]): Map<string, LiveMatchSummary[]> {
  const groups = new Map<string, LiveMatchSummary[]>();
  for (const m of matches) {
    const key = m.courtName || 'Unassigned';
    const list = groups.get(key) || [];
    list.push(m);
    groups.set(key, list);
  }
  return groups;
}
