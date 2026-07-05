interface TimerBarProps {
  seconds: number;
  running: boolean;
  expired: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerBar({ seconds, running, expired, onStart, onPause, onReset }: TimerBarProps) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        background: expired ? 'rgba(255,71,87,0.15)' : 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Innings Timer</div>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: expired ? 'var(--danger)' : seconds <= 60 ? '#ffb020' : 'var(--text)',
          }}
        >
          {display}
          {expired && ' — TIME!'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {running ? (
          <button onClick={onPause} style={btnStyle}>Pause</button>
        ) : (
          <button onClick={onStart} style={{ ...btnStyle, background: 'var(--accent)', color: '#0a0e12', fontWeight: 700 }}>
            Start
          </button>
        )}
        <button onClick={onReset} style={btnStyle}>Reset</button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  borderRadius: 8,
  background: 'var(--surface-elevated)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  fontWeight: 600,
};
