import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorCricketMatchState, Venue } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { getScoreboardDisplay } from '@sportsync/sport-rules';
import { playSiren, formatTimer } from '../lib/siren';

export function ScoreboardDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<IndoorCricketMatchState | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const sirenPlayed = useRef(false);

  const primary = venue?.branding.primaryColor || '#00d4aa';
  const secondary = venue?.branding.secondaryColor || '#141b24';

  useEffect(() => {
    if (!matchId) return;

    let socket: ReturnType<typeof io> | null = null;

    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: IndoorCricketMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const [venueData, teams, players] = await Promise.all([
          api.venues.get(match.venueId),
          api.teams.list(match.venueId),
          api.players.list(match.venueId),
        ]);
        setVenue(venueData);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
        setPlayerNames(Object.fromEntries(players.map((p) => [p.id, p.displayName])));
      }
    });

    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: IndoorCricketMatchState) => setState(s));

    return () => {
      socket?.disconnect();
    };
  }, [matchId]);

  const innings = state?.innings[state.battingTeamIndex];
  useEffect(() => {
    if (innings?.timerExpired && !sirenPlayed.current) {
      sirenPlayed.current = true;
      playSiren();
    }
    if (!innings?.timerExpired) sirenPlayed.current = false;
  }, [innings?.timerExpired]);

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: secondary, color: '#fff' }}>
        Loading scoreboard...
      </div>
    );
  }

  const display = getScoreboardDisplay(state);
  const batting = display.battingTeam;
  const bowling = display.bowlingTeam;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${secondary} 0%, #0a0e12 100%)`, color: '#fff', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {venue?.branding.logoUrl && (
          <img src={venue.branding.logoUrl} alt="" style={{ height: 48, marginBottom: '0.75rem' }} />
        )}
        <div style={{ fontSize: '1rem', color: '#7d8fa3', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {venue?.name || 'SportSync Live'}
        </div>
        {venue?.branding.sponsorBannerUrl && (
          <img src={venue.branding.sponsorBannerUrl} alt="Sponsor" style={{ maxHeight: 40, marginTop: '0.75rem' }} />
        )}
      </div>

      {display.current.timerSeconds != null && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: 12,
            background: display.current.timerExpired ? 'rgba(255,71,87,0.2)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${display.current.timerExpired ? '#ff4757' : primary}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>INNINGS TIMER</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: display.current.timerExpired ? '#ff4757' : primary }}>
            {formatTimer(display.current.timerSeconds)}
            {display.current.timerExpired && ' — TIME!'}
          </div>
        </div>
      )}

      {state.status === 'completed' && (
        <div style={{ textAlign: 'center', fontSize: '1.5rem', color: primary, marginBottom: '1rem' }}>Match Complete</div>
      )}

      <div style={{ opacity: 0.7, marginBottom: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{teamNames[bowling.teamId] || bowling.teamId}</div>
        <div style={{ fontSize: '3rem', fontWeight: 800 }}>{bowling.total}/{bowling.wickets}</div>
      </div>

      <div style={{ padding: '2rem', background: `${primary}18`, borderRadius: 16, border: `2px solid ${primary}55` }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{teamNames[batting.teamId] || batting.teamId}</div>
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: primary }}>{batting.total}/{batting.wickets}</div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Batter</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{playerNames[display.current.strikerId] || '—'} *</div>
            <div style={{ fontSize: '1.1rem' }}>{playerNames[display.current.nonStrikerId] || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Bowler</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{playerNames[display.current.bowlerId] || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7d8fa3' }}>Over</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{display.current.over}.{display.current.ball}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
