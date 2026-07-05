import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { Competition, LiveMatchSummary } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';
import { formatLiveScore } from '../components/LiveScoreCard';

export function DashboardHome() {
  const { venue, loading } = useVenue();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatchSummary[]>([]);
  const [fixtureCount, setFixtureCount] = useState(0);

  useEffect(() => {
    if (!venue) return;
    Promise.all([
      api.competitions.list(venue.id),
      api.live.search({ venueId: venue.id, status: 'live' }),
      api.fixtures.list(venue.id),
    ]).then(([comps, live, fixtures]) => {
      setCompetitions(comps);
      setLiveMatches(live);
      setFixtureCount(fixtures.length);
    });
  }, [venue]);

  if (loading) return <div>Loading...</div>;
  if (!venue) return <div>No venue configured. Run <code>npm run seed</code> to create demo data.</div>;

  const activeComps = competitions.filter((c) => c.status === 'active').length;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{venue.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {venue.productTier === 'stadium' ? 'Stadium' : 'Club'} · {venue.courtCount} courts
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Active Competitions" value={String(activeComps)} />
        <StatCard label="Live Matches" value={String(liveMatches.length)} highlight={liveMatches.length > 0} />
        <StatCard label="Total Fixtures" value={String(fixtureCount)} />
        <StatCard label="Sports" value={String(venue.sports.length)} />
      </div>

      {liveMatches.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Live Now</h2>
            <Link to="/courts/live" style={{ fontSize: '0.85rem' }}>Multi-court view →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {liveMatches.map((m) => {
              const scores = formatLiveScore(m);
              return (
                <div key={m.matchId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge live" style={{ marginRight: '0.5rem' }}>Live</span>
                    {m.homeTeamName} vs {m.awayTeamName}
                    {m.courtName && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        · {m.courtName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700 }}>{scores.home} – {scores.away}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/competitions"><button className="primary">Manage Competitions</button></Link>
          <Link to="/teams"><button>Add Team</button></Link>
          <Link to="/live"><button>View Live Scores</button></Link>
          <Link to="/courts/live"><button>Multi-Court Live</button></Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card" style={highlight ? { borderColor: 'var(--danger)' } : undefined}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
