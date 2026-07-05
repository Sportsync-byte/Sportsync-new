import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '@sportsync/api-client';
import type { LiveMatchSummary } from '@sportsync/shared';
import { SOCKET_EVENTS } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function LiveScoresPage() {
  const { venue } = useVenue();
  const [matches, setMatches] = useState<LiveMatchSummary[]>([]);
  const [search, setSearch] = useState('');

  const load = () => {
    if (!venue) return;
    api.live.search({
      venueId: venue.id,
      ...(search ? { teamName: search } : {}),
    }).then(setMatches);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [venue, search]);

  useEffect(() => {
    if (!venue) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => s.emit('venue:join', venue.id));
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
            <div key={m.matchId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <span className="badge live" style={{ marginRight: '0.5rem' }}>Live</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {m.competitionName}{m.courtName ? ` · ${m.courtName}` : ''}
                  </span>
                </div>
                {m.over != null && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Over {m.over}.{m.ball}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{m.homeTeamName}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{m.homeScore}/{m.homeWickets}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>vs</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.awayTeamName}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{m.awayScore}/{m.awayWickets}</div>
                </div>
              </div>
              <a
                href={`http://localhost:5174/display/${m.matchId}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem' }}
              >
                Open scoreboard display →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
