import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sportsync.local');
  const [password, setPassword] = useState('admin123');
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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>SportSync</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Stadium Dashboard</p>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(255,92,92,0.15)', borderRadius: 8, marginBottom: '1rem', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />

        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />

        <button type="submit" className="primary" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
          Demo: admin@sportsync.local / admin123
        </p>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', marginTop: '0.75rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' };
