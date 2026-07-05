interface ActionBarProps {
  onUndo: () => void;
  onWicket: () => void;
  canUndo: boolean;
}

export function ActionBar({ onUndo, onWicket, canUndo }: ActionBarProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        marginTop: 'auto',
        paddingTop: '0.5rem',
      }}
    >
      <button
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: 700,
          background: 'var(--danger)',
          color: '#fff',
          opacity: canUndo ? 1 : 0.4,
        }}
      >
        Undo Last Ball
      </button>
      <button
        onClick={onWicket}
        style={{
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: 600,
          background: 'var(--surface-elevated)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        }}
      >
        Wicket
      </button>
    </div>
  );
}
