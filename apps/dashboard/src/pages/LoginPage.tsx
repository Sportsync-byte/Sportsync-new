import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5175';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0a1210 0%, #0f1419 50%, #1a2332 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <a href={WEBSITE_URL} style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>
          SportSync
        </a>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '1rem' }}>
          Venue host portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 400, lineHeight: 1.6 }}>
          Manage competitions, teams, fixtures, ladders, and venue settings for your sports venue.
        </p>
        <ul style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Generate fixtures & track ladders</li>
          <li>Activate licensed TV scoreboards</li>
          <li>Send SMS fixture reminders (Stadium)</li>
          <li>Monitor live scores across courts</li>
        </ul>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Competition management for venue hosts</p>

          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(255,92,92,0.15)', borderRadius: 8, marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required autoComplete="email" />

          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required autoComplete="current-password" />

          <button type="submit" className="primary" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem' }}>
            {loading ? 'Signing in…' : 'Sign in to dashboard'}
          </button>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', textAlign: 'center' }}>
            Demo after seed: admin@sportsync.local / admin123
          </p>
          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
            <a href={WEBSITE_URL}>← Back to sportsync.com</a>
          </p>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', marginTop: '0.75rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' };
