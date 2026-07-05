import { useEffect, useState } from 'react';
import { api } from '@sportsync/api-client';
import type { Court } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

const SPORTS = ['indoor-cricket', 'indoor-netball', 'indoor-football', 'basketball', 'touch-rugby'];

export function CourtsPage() {
  const { venue } = useVenue();
  const [courts, setCourts] = useState<Court[]>([]);
  const [name, setName] = useState('');
  const [sport, setSport] = useState('indoor-cricket');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!venue) return;
    setCourts(await api.venues.courts(venue.id));
  };

  useEffect(() => { load(); }, [venue]);

  const createCourt = async () => {
    if (!venue || !name.trim()) return;
    try {
      await api.venues.createCourt(venue.id, { name: name.trim(), sport: sport as Court['sport'] });
      setName('');
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create court');
    }
  };

  const updateCourt = async (court: Court, data: Partial<Court>) => {
    if (!venue) return;
    await api.venues.updateCourt(venue.id, court.id, data);
    load();
  };

  const deleteCourt = async (courtId: string) => {
    if (!venue || !confirm('Delete this court?')) return;
    await api.venues.deleteCourt(venue.id, courtId);
    load();
  };

  if (!venue) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Courts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage courts for scheduling, scoreboards, and multi-court live view.
          </p>
        </div>
        <button className="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Court'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <input
            placeholder="Court name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <select value={sport} onChange={(e) => setSport(e.target.value)} style={{ ...inputStyle, marginTop: '0.5rem' }}>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="primary" style={{ marginTop: '0.75rem' }} onClick={createCourt} disabled={!name.trim()}>
            Create Court
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Sport</th>
              <th style={thStyle}>Order</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {courts.map((court) => (
              <tr key={court.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>
                  <input
                    defaultValue={court.name}
                    onBlur={(e) => {
                      if (e.target.value !== court.name) updateCourt(court, { name: e.target.value });
                    }}
                    style={{ ...inputStyle, padding: '0.35rem 0.5rem' }}
                  />
                </td>
                <td style={tdStyle}>
                  <select
                    value={court.sport || 'indoor-cricket'}
                    onChange={(e) => updateCourt(court, { sport: e.target.value as Court['sport'] })}
                    style={{ ...inputStyle, padding: '0.35rem 0.5rem' }}
                  >
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={tdStyle}>{court.displayOrder}</td>
                <td style={tdStyle}>
                  <button onClick={() => deleteCourt(court.id)} style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courts.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No courts configured.</div>
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
};
const thStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem' };
