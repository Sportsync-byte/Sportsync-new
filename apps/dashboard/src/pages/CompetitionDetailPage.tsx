import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { Competition, Fixture, Team, LadderEntry } from '@sportsync/shared';

export function CompetitionDetailPage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladder, setLadder] = useState<LadderEntry[]>([]);
  const [tab, setTab] = useState<'fixtures' | 'ladder'>('fixtures');

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const load = async () => {
    if (!competitionId) return;
    const comp = await api.competitions.get(competitionId);
    setCompetition(comp);
    const [fix, teamList, ladderData] = await Promise.all([
      api.competitions.fixtures(competitionId),
      api.teams.list(comp.venueId),
      api.competitions.ladder(competitionId),
    ]);
    setFixtures(fix);
    setTeams(teamList);
    setLadder(ladderData);
  };

  useEffect(() => {
    load();
  }, [competitionId]);

  const generateFixtures = async () => {
    if (!competitionId) return;
    await api.competitions.generateFixtures(competitionId);
    load();
  };

  const startMatch = async (fixtureId: string) => {
    await api.fixtures.start(fixtureId);
    load();
    window.open('http://localhost:5174', '_blank');
  };

  if (!competition) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/competitions" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Competitions</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{competition.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {competition.settings.formatKey} · {competition.teamIds.length} teams
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={tab === 'fixtures' ? 'primary' : ''} onClick={() => setTab('fixtures')}>Fixtures</button>
        <button className={tab === 'ladder' ? 'primary' : ''} onClick={() => setTab('ladder')}>Ladder</button>
        {fixtures.length === 0 && (
          <button className="primary" onClick={generateFixtures} style={{ marginLeft: 'auto' }}>
            Generate Fixtures
          </button>
        )}
      </div>

      {tab === 'fixtures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {fixtures.map((f) => (
            <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Round {f.round}</div>
                <div style={{ fontWeight: 600 }}>
                  {teamMap[f.homeTeamId] || f.homeTeamId} vs {teamMap[f.awayTeamId] || f.awayTeamId}
                </div>
                {f.status === 'completed' && (
                  <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {f.homeScore}/{f.homeWickets} – {f.awayScore}/{f.awayWickets}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${f.status === 'live' ? 'live' : 'draft'}`}>{f.status}</span>
                {f.status === 'scheduled' && (
                  <button className="primary" onClick={() => startMatch(f.id)}>Start</button>
                )}
                {f.status === 'live' && (
                  <a href={`http://localhost:5174?match=${f.matchId}`} target="_blank" rel="noreferrer">
                    <button>Score</button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ladder' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Team</th>
              <th style={thStyle}>P</th>
              <th style={thStyle}>W</th>
              <th style={thStyle}>L</th>
              <th style={thStyle}>Pts</th>
              <th style={thStyle}>Bonus</th>
            </tr>
          </thead>
          <tbody>
            {ladder.map((entry) => (
              <tr key={entry.teamId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{entry.position}</td>
                <td style={tdStyle}>{teamMap[entry.teamId] || entry.teamId}</td>
                <td style={tdStyle}>{entry.played}</td>
                <td style={tdStyle}>{entry.won}</td>
                <td style={tdStyle}>{entry.lost}</td>
                <td style={tdStyle}>{entry.points}</td>
                <td style={tdStyle}>{entry.bonusPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' };
const tdStyle: React.CSSProperties = { padding: '0.75rem' };
