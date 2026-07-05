import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '@sportsync/api-client';
import type { LiveMatchSummary } from '@sportsync/shared';
import { SOCKET_EVENTS } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';
import { LiveScoreCard, groupMatchesByCourt } from '../components/LiveScoreCard';

export function MultiCourtLivePage() {
  const { venue } = useVenue();
  const [matches, setMatches] = useState<LiveMatchSummary[]>([]);

  const load = () => {
    if (!venue) return;
    api.live.search({ venueId: venue.id, status: 'live' }).then(setMatches);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [venue]);

  useEffect(() => {
    if (!venue) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => s.emit('venue:join', venue.id));
    s.on(SOCKET_EVENTS.VENUE_LIVE, () => load());
    s.on(SOCKET_EVENTS.SCOREBOARD_UPDATE, () => load());
    return () => { s.disconnect(); };
  }, [venue]);

  if (!venue) return null;

  const byCourt = groupMatchesByCourt(matches);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Multi-Court Live</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        All live matches across {venue.courtCount} courts — updates in real time.
      </p>

      {matches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No live matches on any court right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {[...byCourt.entries()].map(([courtName, courtMatches]) => (
            <div key={courtName}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>{courtName}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {courtMatches.map((m) => (
                  <LiveScoreCard key={m.matchId} match={m} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
