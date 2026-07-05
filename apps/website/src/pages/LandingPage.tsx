import { Link } from 'react-router-dom';
import { TIER_LIMITS } from '@sportsync/shared';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173';

export function LandingPage() {
  return (
    <div>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>SportSync</div>
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/pricing" style={{ color: 'var(--muted)' }}>Pricing</Link>
            <a href={`${DASHBOARD_URL}`} className="btn btn-primary">Venue Login</a>
          </nav>
        </div>
      </header>

      <section style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em' }}>
            INDOOR SPORTS VENUES
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Run competitions.<br />Score live.<br />Fill every court.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.15rem', maxWidth: 560, margin: '0 auto 2rem' }}>
            SportSync is the all-in-one platform for fixture management, tablet scoring, TV scoreboards, player stats, and SMS reminders — built for clubs and multi-court stadiums.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${DASHBOARD_URL}`} className="btn btn-primary">Start managing your venue</a>
            <Link to="/pricing" className="btn btn-secondary">View pricing</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: 'var(--surface)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.75rem' }}>Everything your venue needs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <FeatureCard title="Competition management" desc="Teams, players, fixtures, ladders, and stats — cricket, netball, and more." />
            <FeatureCard title="Tablet scoring app" desc="Purpose-built scorer interface with offline support and real-time sync." />
            <FeatureCard title="Licensed scoreboards" desc="Install the scoreboard app on any TV PC. One licence per display, linked to your venue account." />
            <FeatureCard title="SMS reminders" desc="Stadium tier venues can text players fixture times and court assignments automatically." />
            <FeatureCard title="Live multi-court view" desc="See every live match across all courts from one dashboard." />
            <FeatureCard title="Public player profiles" desc="Shareable player stats pages with clean URLs for your community." />
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>How scoreboard licensing works</h2>
            <ol style={{ color: 'var(--muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>Your venue receives a unique licence key when you sign up.</li>
              <li>Install the SportSync Scoreboard app on each TV or display PC.</li>
              <li>Enter your licence key once — the scoreboard pairs with your venue account over the internet.</li>
              <li>Club tier includes 1 scoreboard. Stadium includes 4. Add more for a small monthly fee.</li>
              <li>Assign scoreboards to courts from your venue dashboard — they auto-show live matches.</li>
            </ol>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '1rem' }}>SSYNC-XXXX-XXXX-XXXX</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Each licence key ties scoreboard hardware to your venue host account. Revoke devices anytime from the dashboard.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: 'var(--surface)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Ready to modernise your venue?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Club from {TIER_LIMITS.club.maxCompetitions} competitions · Stadium from unlimited courts & SMS
          </p>
          <a href={`${DASHBOARD_URL}`} className="btn btn-primary">Log in to your venue dashboard</a>
        </div>
      </section>

      <footer style={{ padding: '2rem 0', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        <div className="container">© {new Date().getFullYear()} SportSync. All rights reserved.</div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{title}</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{desc}</p>
    </div>
  );
}
