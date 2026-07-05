import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type PlayerStats } from '@sportsync/api-client';
import type { Competition, Fixture, Team, LadderEntry, Player } from '@sportsync/shared';

export function CompetitionDetailPage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladder, setLadder] = useState<LadderEntry[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<'fixtures' | 'ladder' | 'stats'>('fixtures');

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p.displayName]));
  const isNetball = competition?.sport === 'indoor-netball';

  const load = async () => {
    if (!competitionId) return;
    const comp = await api.competitions.get(competitionId);
    setCompetition(comp);
    const [fix, teamList, ladderData, statsData, playerList] = await Promise.all([
      api.competitions.fixtures(competitionId),
      api.teams.list(comp.venueId),
      api.competitions.ladder(competitionId),
      api.competitions.stats(competitionId),
      api.players.list(comp.venueId),
    ]);
    setFixtures(fix);
    setTeams(teamList);
    setLadder(ladderData);
    setStats(statsData);
    setPlayers(playerList);
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

  const downloadFile = async (path: string, filename: string) => {
    const token = localStorage.getItem('sportsync-token');
    const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!competition) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/competitions" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Competitions</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{competition.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {competition.settings.formatKey} · {competition.teamIds.length} teams
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={tab === 'fixtures' ? 'primary' : ''} onClick={() => setTab('fixtures')}>Fixtures</button>
        <button className={tab === 'ladder' ? 'primary' : ''} onClick={() => setTab('ladder')}>Ladder</button>
        <button className={tab === 'stats' ? 'primary' : ''} onClick={() => setTab('stats')}>Statistics</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => downloadFile(api.export.ladderCsv(competition.id), 'ladder.csv')}>Ladder CSV</button>
          <button onClick={() => downloadFile(api.export.ladderPdf(competition.id), 'ladder.pdf')}>Ladder PDF</button>
          <button onClick={() => downloadFile(api.export.statsCsv(competition.id), 'stats.csv')}>Stats CSV</button>
          {fixtures.length === 0 && (
            <button className="primary" onClick={generateFixtures}>Generate Fixtures</button>
          )}
        </div>
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
                    {isNetball
                      ? `${f.homeScore} – ${f.awayScore}`
                      : `${f.homeScore}/${f.homeWickets} – ${f.awayScore}/${f.awayWickets}`}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${f.status === 'live' ? 'live' : 'draft'}`}>{f.status}</span>
                {f.status === 'completed' && f.matchId && (
                  <button onClick={() => downloadFile(api.export.scorecardPdf(f.matchId!), 'scorecard.pdf')}>PDF</button>
                )}
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

      {tab === 'stats' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Player</th>
                <th style={thStyle}>M</th>
                {isNetball ? (
                  <>
                    <th style={thStyle}>Goals</th>
                    <th style={thStyle}>Assists</th>
                  </>
                ) : (
                  <>
                    <th style={thStyle}>Runs</th>
                    <th style={thStyle}>4s</th>
                    <th style={thStyle}>6s</th>
                    <th style={thStyle}>Wkts</th>
                    <th style={thStyle}>Ct</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(isNetball
                ? [...stats].sort((a, b) => b.goals - a.goals)
                : [...stats].sort((a, b) => b.runs - a.runs)
              ).map((s) => (
                <tr key={s.playerId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>{playerMap[s.playerId] || s.playerId}</td>
                  <td style={tdStyle}>{s.matchesPlayed}</td>
                  {isNetball ? (
                    <>
                      <td style={tdStyle}>{s.goals}</td>
                      <td style={tdStyle}>{s.assists}</td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>{s.runs}</td>
                      <td style={tdStyle}>{s.fours}</td>
                      <td style={tdStyle}>{s.sixes}</td>
                      <td style={tdStyle}>{s.wickets}</td>
                      <td style={tdStyle}>{s.catches}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {stats.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Statistics appear after matches are completed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' };
const tdStyle: React.CSSProperties = { padding: '0.75rem' };
