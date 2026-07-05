import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { PlayerProfile } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function PlayerProfilePage() {
  const { playerId, slug } = useParams<{ playerId?: string; slug?: string }>();
  const { venue } = useVenue();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (slug) {
      api.players.publicProfileBySlug(slug, venue?.id).then(setProfile).catch(() => setProfile(null));
      return;
    }
    if (!playerId) return;
    api.players.publicProfile(playerId).then(setProfile).catch(() => setProfile(null));
  }, [playerId, slug, venue?.id]);

  if (!profile) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const totalRuns = profile.stats.reduce((s, r) => s + r.runs, 0);
  const totalWickets = profile.stats.reduce((s, r) => s + r.wickets, 0);
  const totalGoals = profile.stats.reduce((s, r) => s + (r.goals ?? 0), 0);
  const totalAssists = profile.stats.reduce((s, r) => s + (r.assists ?? 0), 0);
  const hasNetballStats = profile.stats.some((s) => (s.goals ?? 0) > 0 || (s.assists ?? 0) > 0);
  const profilePath = profile.slug ? `/p/${profile.slug}` : `/players/${profile.id}`;

  return (
    <div>
      <Link to="/players" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Players</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{profile.displayName}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {profile.teams.map((t) => t.name).join(', ') || 'No team'}
      </p>
      {profile.slug && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Public URL: <code>{profilePath}</code>
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {hasNetballStats ? (
          <>
            <StatCard label="Career Goals" value={String(totalGoals)} />
            <StatCard label="Assists" value={String(totalAssists)} />
          </>
        ) : (
          <>
            <StatCard label="Career Runs" value={String(totalRuns)} />
            <StatCard label="Wickets" value={String(totalWickets)} />
          </>
        )}
        <StatCard label="Matches" value={String(profile.stats.reduce((s, r) => s + r.matchesPlayed, 0))} />
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Season History</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Competition</th>
              <th style={thStyle}>M</th>
              {hasNetballStats ? (
                <>
                  <th style={thStyle}>Goals</th>
                  <th style={thStyle}>Ast</th>
                </>
              ) : (
                <>
                  <th style={thStyle}>Runs</th>
                  <th style={thStyle}>Wkts</th>
                  <th style={thStyle}>Ct</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {profile.stats.map((s) => (
              <tr key={s.competitionId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{s.competitionName || s.competitionId}</td>
                <td style={tdStyle}>{s.matchesPlayed}</td>
                {hasNetballStats ? (
                  <>
                    <td style={tdStyle}>{s.goals ?? 0}</td>
                    <td style={tdStyle}>{s.assists ?? 0}</td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{s.runs}</td>
                    <td style={tdStyle}>{s.wickets}</td>
                    <td style={tdStyle}>{s.catches}</td>
                  </>
                )}
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
