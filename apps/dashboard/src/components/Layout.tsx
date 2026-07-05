import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/live', label: 'Live Scores' },
];

export function Layout({ children }: { children: ReactNode }) {
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
          gap: '2rem',
        }}
      >
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>SportSync</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stadium Dashboard</div>
        </div>
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
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>{children}</main>
    </div>
  );
}
