const placeholderCompetitions = [
  { id: '1', name: 'Summer Indoor Cricket', sport: 'Indoor Cricket', status: 'active' as const },
  { id: '2', name: 'Winter Netball League', sport: 'Indoor Netball', status: 'draft' as const },
];

export function CompetitionsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Competitions</h1>
        <button className="primary">New Competition</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {placeholderCompetitions.map((comp) => (
          <div
            key={comp.id}
            className="card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{comp.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{comp.sport}</div>
            </div>
            <span className={`badge ${comp.status}`}>{comp.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
