export function LiveScoresPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Live Scores</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Spectators can search by venue, competition, court, or team — no login required.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <input
          type="search"
          placeholder="Search venue, competition, court, or team..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '1rem',
          }}
        />
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No live matches right now. Scores will appear here automatically when games are in progress.
      </div>
    </div>
  );
}
