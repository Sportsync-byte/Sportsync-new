import { useEffect, useState } from 'react';
import { api } from '@sportsync/api-client';
import type { ScoreboardDevice, Court } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5175';

export function ScoreboardsPage() {
  const { venue } = useVenue();
  const [devices, setDevices] = useState<ScoreboardDevice[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [licenseKey, setLicenseKey] = useState('');
  const [limit, setLimit] = useState(0);
  const [active, setActive] = useState(0);

  const load = async () => {
    if (!venue) return;
    const [sb, courtList, license] = await Promise.all([
      api.scoreboards.list(venue.id),
      api.venues.courts(venue.id),
      api.venues.license(venue.id),
    ]);
    setDevices(sb.devices);
    setLimit(sb.limit);
    setActive(sb.active);
    setCourts(courtList);
    setLicenseKey(license.licenseKey);
  };

  useEffect(() => { load(); }, [venue]);

  const assignCourt = async (deviceId: string, courtId: string) => {
    await api.scoreboards.update(deviceId, { courtId: courtId || undefined });
    load();
  };

  const revoke = async (deviceId: string) => {
    if (!confirm('Revoke this scoreboard? It will need to be re-activated with the licence key.')) return;
    await api.scoreboards.revoke(deviceId);
    load();
  };

  if (!venue) return null;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Scoreboards</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Licence key pairs TV displays with your venue.{' '}
        <a href={`${import.meta.env.VITE_SCOREBOARD_URL || 'http://localhost:5176'}/activate`} target="_blank" rel="noreferrer">
          Open scoreboard app →
        </a>
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 560 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Venue licence key</div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0', letterSpacing: '0.05em' }}>
          {licenseKey || '—'}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {active} of {limit} scoreboard{limit !== 1 ? 's' : ''} active.
          {venue.subscription && !venue.subscription.smsNotifications && ' Upgrade to Stadium for SMS.'}
        </p>
        {active >= limit && (
          <button className="primary" style={{ marginTop: '0.75rem' }} onClick={() => api.venues.addExtraScoreboards(venue.id, 1).then(load)}>
            Add scoreboard slot (+1)
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Display</th>
              <th style={thStyle}>Court</th>
              <th style={thStyle}>Last seen</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {devices.filter((d) => d.status === 'active').map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{d.name}</td>
                <td style={tdStyle}>
                  <select
                    value={d.courtId || ''}
                    onChange={(e) => assignCourt(d.id, e.target.value)}
                    style={{ padding: '0.35rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="">Any court</option>
                    {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td style={tdStyle}>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : '—'}</td>
                <td style={tdStyle}>
                  <button onClick={() => revoke(d.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {devices.filter((d) => d.status === 'active').length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No scoreboards activated yet. Install the scoreboard app on a TV PC and enter your licence key.
          </div>
        )}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <a href={WEBSITE_URL} target="_blank" rel="noreferrer">sportsync.com</a> · Scoreboard app runs fullscreen on display hardware
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem' };
