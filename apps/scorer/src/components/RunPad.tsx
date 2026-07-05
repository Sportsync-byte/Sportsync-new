import type { RunValue } from '@sportsync/shared';

interface RunPadProps {
  values: RunValue[];
  onRun: (runs: RunValue) => void;
}

export function RunPad({ values, onRun }: RunPadProps) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Runs
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
        }}
      >
        {values.map((run) => (
          <button
            key={run}
            onClick={() => onRun(run)}
            style={{
              padding: '1.25rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'var(--run-btn)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {run}
          </button>
        ))}
      </div>
    </div>
  );
}
