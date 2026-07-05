import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorCricketMatchState, Venue } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { IndoorCricketPublicBoard } from '../components/IndoorCricketPublicBoard';
import { playSiren } from '../lib/siren';

export function ScoreboardDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<IndoorCricketMatchState | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

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
    if (innings?.timerExpired) playSiren();
  }, [innings?.timerExpired]);

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#141b24', color: '#fff' }}>
        Loading scoreboard...
      </div>
    );
  }

  return (
    <IndoorCricketPublicBoard
      state={state}
      labels={{
        venueName: venue?.name,
        logoUrl: venue?.branding.logoUrl,
        sponsorBannerUrl: venue?.branding.sponsorBannerUrl,
        teamNames,
        playerNames,
        primaryColor: venue?.branding.primaryColor,
        secondaryColor: venue?.branding.secondaryColor,
      }}
    />
  );
}
