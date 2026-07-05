const EXTRAS = [
  { type: 'wide', label: 'Wide', runs: 1 },
  { type: 'no-ball', label: 'No Ball', runs: 1 },
  { type: 'leg-side-wide', label: 'Leg Side Wide', runs: 1 },
  { type: 'bye', label: 'Byes', runs: 1 },
  { type: 'leg-bye', label: 'Leg Byes', runs: 1 },
] as const;

interface ExtrasPadProps {
  onExtra: (type: string, runs: number) => void;
}

export function ExtrasPad({ onExtra }: ExtrasPadProps) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Extras
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '0.5rem',
        }}
      >
        {EXTRAS.map((extra) => (
          <button
            key={extra.type}
            onClick={() => onExtra(extra.type, extra.runs)}
            style={{
              padding: '0.875rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {extra.label}
          </button>
        ))}
      </div>
    </div>
  );
}
