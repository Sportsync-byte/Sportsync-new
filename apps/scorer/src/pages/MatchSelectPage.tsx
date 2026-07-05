import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { Fixture, Team } from '@sportsync/shared';

export function MatchSelectPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  useEffect(() => {
    const matchParam = searchParams.get('match');
    if (matchParam) {
      navigate(`/match/${matchParam}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    async function load() {
      try {
        const venues = await api.venues.list();
        const venue = venues[0];
        if (!venue) {
          setLoading(false);
          return;
        }
        const [fix, teamList] = await Promise.all([
          api.fixtures.list(venue.id),
          api.teams.list(venue.id),
        ]);
        setFixtures(fix.filter((f) => f.status === 'scheduled' || f.status === 'live'));
        setTeams(teamList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const startOrOpen = async (fixture: Fixture) => {
    if (fixture.status === 'live' && fixture.matchId) {
      navigate(`/match/${fixture.matchId}`);
      return;
    }
    const { match } = await api.fixtures.start(fixture.id) as { match: { matchId: string } };
    navigate(`/match/${match.matchId}`);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading matches...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>SportSync Scorer</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Select a match to score. Works offline — syncs when connection returns.
      </p>

      {fixtures.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12 }}>
          No matches available. Create fixtures in the dashboard first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {fixtures.map((f) => (
            <button
              key={f.id}
              onClick={() => startOrOpen(f)}
              style={{
                padding: '1rem 1.25rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Round {f.round} · {f.status}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>
                {teamMap[f.homeTeamId] || 'Home'} vs {teamMap[f.awayTeamId] || 'Away'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
