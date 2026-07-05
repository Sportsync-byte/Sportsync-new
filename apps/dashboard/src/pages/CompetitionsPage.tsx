import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { Competition, Team } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function CompetitionsPage() {
  const { venue } = useVenue();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState('indoor-cricket');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const load = async () => {
    if (!venue) return;
    const [comps, teamList] = await Promise.all([
      api.competitions.list(venue.id),
      api.teams.list(venue.id),
    ]);
    setCompetitions(comps);
    setTeams(teamList);
  };

  useEffect(() => {
    load();
  }, [venue]);

  const createCompetition = async () => {
    if (!venue || !name) return;
    await api.competitions.create({
      venueId: venue.id,
      name,
      sport: sport as 'indoor-cricket' | 'indoor-netball' | 'indoor-football',
      teamIds: selectedTeams,
      settings: { formatKey: 'six-aside', doubleRoundRobin: false, pointsForWin: 4, pointsForTie: 2, pointsForLoss: 0 },
    });
    setName('');
    setSelectedTeams([]);
    setShowForm(false);
    load();
  };

  if (!venue) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Competitions</h1>
        <button className="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Competition'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <input
            placeholder="Competition name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <select value={sport} onChange={(e) => setSport(e.target.value)} style={{ ...inputStyle, marginTop: '0.5rem' }}>
            <option value="indoor-cricket">Indoor Cricket</option>
            <option value="indoor-netball">Indoor Netball</option>
            <option value="indoor-football">Indoor Football</option>
          </select>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Teams</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {teams.map((t) => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(t.id)}
                    onChange={(e) =>
                      setSelectedTeams(
                        e.target.checked
                          ? [...selectedTeams, t.id]
                          : selectedTeams.filter((id) => id !== t.id)
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <button className="primary" style={{ marginTop: '1rem' }} onClick={createCompetition} disabled={!name || selectedTeams.length < 2}>
            Create Competition
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {competitions.map((comp) => (
          <Link key={comp.id} to={`/competitions/${comp.id}`} style={{ color: 'inherit' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{comp.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {comp.sport} · {comp.teamIds.length} teams · {comp.season}
                </div>
              </div>
              <span className={`badge ${comp.status}`}>{comp.status}</span>
            </div>
          </Link>
        ))}
        {competitions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No competitions yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '1rem',
};
