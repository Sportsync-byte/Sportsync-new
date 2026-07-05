import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import type { Player, Team } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function PlayersPage() {
  const { venue } = useVenue();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false);

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const load = () => {
    if (!venue) return;
    Promise.all([api.players.list(venue.id), api.teams.list(venue.id)]).then(([p, t]) => {
      setPlayers(p);
      setTeams(t);
    });
  };

  useEffect(() => { load(); }, [venue]);

  const createPlayer = async () => {
    if (!venue || !firstName || !lastName) return;
    try {
      await api.players.create({
        venueId: venue.id,
        firstName,
        lastName,
        phone: phone || undefined,
        teamIds: teamId ? [teamId] : [],
      });
      setFirstName('');
      setLastName('');
      setPhone('');
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create player');
    }
  };

  const toggleSmsOptOut = async (player: Player) => {
    await api.players.update(player.id, { smsOptOut: !player.smsOptOut });
    load();
  };

  if (!venue) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Players</h1>
        <button className="primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Player'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
          </div>
          <input placeholder="Mobile (E.164 e.g. +64211234567)" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginBottom: '0.5rem' }} />
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={inputStyle}>
            <option value="">Select team (optional)</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="primary" style={{ marginTop: '0.75rem' }} onClick={createPlayer} disabled={!firstName || !lastName}>
            Create Player
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>SMS</th>
              <th style={thStyle}>Team</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>
                  <Link to={p.slug ? `/p/${p.slug}` : `/players/${p.id}`} style={{ fontWeight: 600 }}>{p.displayName}</Link>
                </td>
                <td style={tdStyle}>{p.phone || '—'}</td>
                <td style={tdStyle}>
                  {p.phone ? (
                    <button
                      onClick={() => toggleSmsOptOut(p)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        background: p.smsOptOut ? 'var(--surface-elevated)' : 'var(--accent)',
                        color: p.smsOptOut ? 'var(--text-muted)' : '#0a0e12',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {p.smsOptOut ? 'Opted out' : 'Subscribed'}
                    </button>
                  ) : '—'}
                </td>
                <td style={tdStyle}>{p.teamIds.map((id) => teamMap[id]).filter(Boolean).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
