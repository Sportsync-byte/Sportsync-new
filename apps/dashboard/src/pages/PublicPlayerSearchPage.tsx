import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Player } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { useVenue } from '../context/VenueContext';

export function PublicPlayerSearchPage() {
  const { venue } = useVenue();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);

  const search = async () => {
    if (!venue || !query.trim()) return;
    const players = await api.players.search(venue.id, query);
    setResults(players);
  };

  if (!venue) return null;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Player Search</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Public player profiles — no login required to view.</p>

      <div className="card" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search player name..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <button className="primary" onClick={search}>Search</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {results.map((p) => (
          <Link key={p.id} to={`/players/${p.id}`} style={{ color: 'inherit' }}>
            <div className="card" style={{ fontWeight: 600 }}>{p.displayName}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
