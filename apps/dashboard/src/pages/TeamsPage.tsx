import { useEffect, useState } from 'react';
import { api } from '@sportsync/api-client';
import type { Team } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function TeamsPage() {
  const { venue } = useVenue();
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    if (!venue) return;
    api.teams.list(venue.id).then(setTeams);
  };

  useEffect(() => { load(); }, [venue]);

  const createTeam = async () => {
    if (!venue || !name) return;
    await api.teams.create({ venueId: venue.id, name });
    setName('');
    setShowForm(false);
    load();
  };

  if (!venue) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Teams</h1>
        <button className="primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Team'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <button className="primary" onClick={createTeam} disabled={!name}>Create</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {teams.map((team) => (
          <div key={team.id} className="card">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: team.colors.primary, marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600 }}>{team.name}</div>
            {team.shortName && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{team.shortName}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
};
