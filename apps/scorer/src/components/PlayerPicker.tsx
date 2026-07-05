import type { Player } from '@sportsync/shared';
import { useState } from 'react';

interface PlayerPickerProps {
  title: string;
  players: Player[];
  count: number;
  onSelect: (ids: string[]) => void;
}

export function PlayerPicker({ title, players, count, onSelect }: PlayerPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= count) return prev;
      return [...prev, id];
    });
  };

  return (
    <div style={{ padding: '1rem', background: 'var(--accent-dim)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              border: selected.includes(p.id) ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: selected.includes(p.id) ? 'var(--accent-dim)' : 'var(--surface)',
              color: 'var(--text)',
              fontWeight: selected.includes(p.id) ? 700 : 400,
            }}
          >
            {p.displayName}
          </button>
        ))}
      </div>
      {selected.length === count && (
        <button
          onClick={() => onSelect(selected)}
          style={{ marginTop: '0.75rem', padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#0a0e12', fontWeight: 700, borderRadius: 8 }}
        >
          Confirm
        </button>
      )}
    </div>
  );
}
