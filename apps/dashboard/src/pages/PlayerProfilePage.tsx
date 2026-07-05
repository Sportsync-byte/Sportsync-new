import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { PlayerProfile } from '@sportsync/shared';

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (!playerId) return;
    api.players.publicProfile(playerId).then(setProfile);
  }, [playerId]);

  if (!profile) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const totalRuns = profile.stats.reduce((s, r) => s + r.runs, 0);
  const totalWickets = profile.stats.reduce((s, r) => s + r.wickets, 0);

  return (
    <div>
      <Link to="/players" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Players</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{profile.displayName}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {profile.teams.map((t) => t.name).join(', ') || 'No team'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Career Runs" value={String(totalRuns)} />
        <StatCard label="Wickets" value={String(totalWickets)} />
        <StatCard label="Matches" value={String(profile.stats.reduce((s, r) => s + r.matchesPlayed, 0))} />
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Season History</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Competition</th>
              <th style={thStyle}>M</th>
              <th style={thStyle}>Runs</th>
              <th style={thStyle}>Wkts</th>
              <th style={thStyle}>Ct</th>
            </tr>
          </thead>
          <tbody>
            {profile.stats.map((s) => (
              <tr key={s.competitionId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{s.competitionName || s.competitionId}</td>
                <td style={tdStyle}>{s.matchesPlayed}</td>
                <td style={tdStyle}>{s.runs}</td>
                <td style={tdStyle}>{s.wickets}</td>
                <td style={tdStyle}>{s.catches}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {profile.stats.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No statistics yet.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem' };
