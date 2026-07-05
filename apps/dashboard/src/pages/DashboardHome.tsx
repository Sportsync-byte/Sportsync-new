export function DashboardHome() {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome to SportSync</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Manage competitions, fixtures, teams, and live scoring from one place.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatCard label="Active Competitions" value="—" />
        <StatCard label="Live Matches" value="—" />
        <StatCard label="Teams" value="—" />
        <StatCard label="Courts" value="—" />
      </div>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="primary">Create Competition</button>
          <button>Add Team</button>
          <button>Schedule Fixtures</button>
          <button>Open Scorer App</button>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
