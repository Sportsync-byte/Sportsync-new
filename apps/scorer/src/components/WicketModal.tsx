import type { DismissalType, Player } from '@sportsync/shared';
import { useState } from 'react';

const DISMISSAL_TYPES: { value: DismissalType; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'run-out', label: 'Run Out' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hit-wicket', label: 'Hit Wicket' },
];

interface WicketModalProps {
  batters: Player[];
  fielders: Player[];
  onConfirm: (dismissal: { type: DismissalType; batterId: string; fielderId?: string }) => void;
  onCancel: () => void;
}

export function WicketModal({ batters, fielders, onConfirm, onCancel }: WicketModalProps) {
  const [batterId, setBatterId] = useState(batters[0]?.id || '');
  const [type, setType] = useState<DismissalType>('bowled');
  const [fielderId, setFielderId] = useState('');

  const needsFielder = ['caught', 'run-out', 'stumped'].includes(type);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 400 }}>
        <h2 style={{ marginBottom: '1rem' }}>Wicket (-5 runs)</h2>

        <label style={labelStyle}>Batter out</label>
        <select value={batterId} onChange={(e) => setBatterId(e.target.value)} style={inputStyle}>
          {batters.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
        </select>

        <label style={labelStyle}>Dismissal</label>
        <select value={type} onChange={(e) => setType(e.target.value as DismissalType)} style={inputStyle}>
          {DISMISSAL_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {needsFielder && (
          <>
            <label style={labelStyle}>Fielder</label>
            <select value={fielderId} onChange={(e) => setFielderId(e.target.value)} style={inputStyle}>
              <option value="">Select fielder</option>
              {fielders.map((f) => <option key={f.id} value={f.id}>{f.displayName}</option>)}
            </select>
          </>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '0.875rem', borderRadius: 8, background: 'var(--surface-elevated)', color: 'var(--text)' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ type, batterId, fielderId: fielderId || undefined })}
            disabled={needsFielder && !fielderId}
            style={{ flex: 1, padding: '0.875rem', borderRadius: 8, background: 'var(--danger)', color: '#fff', fontWeight: 700 }}
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', marginTop: '0.75rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' };
