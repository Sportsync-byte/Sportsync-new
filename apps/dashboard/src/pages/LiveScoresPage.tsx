import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '@sportsync/api-client';
import type { LiveMatchSummary } from '@sportsync/shared';
import { SOCKET_EVENTS } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';
import { LiveScoreCard } from '../components/LiveScoreCard';

export function LiveScoresPage() {
  const { venue } = useVenue();
  const [matches, setMatches] = useState<LiveMatchSummary[]>([]);
  const [search, setSearch] = useState('');

  const load = () => {
    if (!venue) return;
    api.live.search({
      venueId: venue.id,
      status: 'live',
      ...(search ? { teamName: search } : {}),
    }).then(setMatches);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [venue, search]);

  useEffect(() => {
    if (!venue) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => s.emit('venue:join', venue.id));
    s.on(SOCKET_EVENTS.VENUE_LIVE, () => load());
    s.on(SOCKET_EVENTS.SCOREBOARD_UPDATE, () => load());
    return () => { s.disconnect(); };
  }, [venue]);

  if (!venue) return null;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Live Scores</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        No login required. Search by team name — updates automatically.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <input
          type="search"
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {matches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No live matches right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map((m) => (
            <LiveScoreCard key={m.matchId} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
