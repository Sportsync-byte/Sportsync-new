import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoreboardApi, setDeviceSession } from '../lib/device';

export function ActivatePage() {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [venuePreview, setVenuePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    if (!licenseKey.trim()) return;
    setError('');
    try {
      const info = await scoreboardApi.validateLicense(licenseKey.trim().toUpperCase());
      setVenuePreview(info.venueName);
      if (info.scoreboardsRemaining <= 0) {
        setError('No scoreboard slots remaining on this licence. Upgrade or revoke a device.');
      }
    } catch {
      setError('Invalid licence key');
      setVenuePreview(null);
    }
  };

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await scoreboardApi.activate(
        licenseKey.trim().toUpperCase(),
        deviceName || 'Scoreboard TV'
      );
      setDeviceSession({
        deviceToken: result.deviceToken,
        venueName: result.venueName,
        deviceName: deviceName || 'Scoreboard TV',
      });
      navigate('/display');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <form
        onSubmit={activate}
        style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: 16, padding: '2rem', border: '1px solid var(--border)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>SportSync</div>
          <div style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Scoreboard Display</div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Enter your venue licence key to pair this display with your SportSync account.
        </p>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(255,71,87,0.15)', borderRadius: 8, marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <label style={labelStyle}>Venue licence key</label>
        <input
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
          onBlur={validate}
          placeholder="SSYNC-XXXX-XXXX-XXXX"
          style={{ fontFamily: 'monospace', marginBottom: '0.5rem' }}
          required
        />
        {venuePreview && (
          <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '1rem' }}>✓ {venuePreview}</p>
        )}

        <label style={labelStyle}>Display name</label>
        <input
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="e.g. Court 1 TV"
          style={{ marginBottom: '1.5rem' }}
        />

        <button
          type="submit"
          disabled={loading || !licenseKey}
          style={{ width: '100%', background: 'var(--accent)', color: '#04120e', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Activating…' : 'Activate scoreboard'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--muted)',
  marginBottom: '0.35rem',
};
