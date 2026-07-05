import { Link } from 'react-router-dom';
import { TIER_LIMITS } from '@sportsync/shared';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173';

export function PricingPage() {
  return (
    <div>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)' }}>SportSync</Link>
          <a href={DASHBOARD_URL} className="btn btn-primary">Venue Login</a>
        </div>
      </header>

      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Simple venue pricing</h1>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '3rem' }}>
            One licence key per venue. Pay extra only when you need more scoreboards.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
            <PricingCard
              name="Club"
              price="From $99/mo"
              features={[
                `${TIER_LIMITS.club.maxCourts} courts`,
                `${TIER_LIMITS.club.maxScoreboards} scoreboard licence`,
                `${TIER_LIMITS.club.maxCompetitions} active competitions`,
                'Tablet scoring app',
                'Live scoreboards',
              ]}
            />
            <PricingCard
              name="Stadium"
              price="From $249/mo"
              highlighted
              features={[
                `${TIER_LIMITS.stadium.maxCourts} courts`,
                `${TIER_LIMITS.stadium.maxScoreboards} scoreboard licences included`,
                'SMS fixture reminders',
                'PDF & CSV exports',
                'Multi-court live view',
                'Additional scoreboards +$29/mo each',
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: highlighted ? 'linear-gradient(180deg, #0f1f1a 0%, var(--surface) 100%)' : 'var(--surface)',
        border: highlighted ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 16,
        padding: '2rem',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{name}</h2>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1.5rem' }}>{price}</div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <a href={DASHBOARD_URL} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
        Get started
      </a>
    </div>
  );
}
