import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useVenue } from '../context/VenueContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/teams', label: 'Teams' },
  { to: '/players/search', label: 'Find Players' },
  { to: '/players', label: 'Players' },
  { to: '/live', label: 'Live Scores' },
  { to: '/courts', label: 'Courts' },
  { to: '/courts/live', label: 'Multi-Court' },
  { to: '/scoreboards', label: 'Scoreboards' },
  { to: '/settings', label: 'Venue Settings' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { venue, venues, setVenueId, loading } = useVenue();
  const { user, logout } = useAuth();

  const scorerHref = (() => {
    const base = import.meta.env.VITE_SCORER_URL || 'http://localhost:5174';
    const token = localStorage.getItem('sportsync-token');
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  })();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>SportSync</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stadium Dashboard</div>
        </div>

        {!loading && venues.length > 0 && (
          <select
            value={venue?.id || ''}
            onChange={(e) => setVenueId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.85rem',
            }}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'rgba(0, 200, 150, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {user && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.75rem' }}>
              {user.name} · {user.role}
            </div>
          )}
          <button onClick={logout} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
            Sign Out
          </button>
          <a
          href={scorerHref}
          target="_blank"
          rel="noreferrer"
          style={{
            marginTop: 'auto',
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#0a0f14',
            fontWeight: 600,
            textAlign: 'center',
            fontSize: '0.9rem',
          }}
        >
          Open Scorer App
        </a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>{children}</main>
    </div>
  );
}
