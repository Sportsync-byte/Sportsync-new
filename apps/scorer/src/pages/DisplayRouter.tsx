import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS, scoringEngineSport, type SportId } from '@sportsync/shared';
import type { NetballMatchState, IndoorFootballMatchState, BasketballMatchState, TouchRugbyMatchState } from '@sportsync/shared';
import { api } from '@sportsync/api-client';
import { getNetballScoreboard, getFootballScoreboard, getBasketballScoreboard, getTouchRugbyScoreboard } from '@sportsync/sport-rules';
import { playSiren, formatTimer } from '../lib/siren';
import { ScoreboardDisplayPage } from './ScoreboardDisplayPage';

export function DisplayRouter() {
  const { matchId } = useParams<{ matchId: string }>();
  const [sport, setSport] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    api.matches.get(matchId).then((doc) => {
      const match = doc as { sport?: string };
      setSport(match.sport || 'indoor-cricket');
    });
  }, [matchId]);

  if (!sport) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0e12', color: '#fff' }}>Loading...</div>;
  const engine = scoringEngineSport(sport as SportId);
  if (engine === 'indoor-netball') return <NetballDisplayPage />;
  if (engine === 'indoor-football') return <FootballDisplayPage />;
  if (engine === 'basketball') return <BasketballDisplayPage />;
  if (engine === 'touch-rugby') return <TouchRugbyDisplayPage />;
  return <ScoreboardDisplayPage />;
}

function NetballDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<NetballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!matchId) return;
    let socket: ReturnType<typeof io> | null = null;

    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: NetballMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const teams = await api.teams.list(match.venueId);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
      }
    });

    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: NetballMatchState) => setState(s));

    return () => {
      socket?.disconnect();
    };
  }, [matchId]);

  useEffect(() => {
    if (state?.timerExpired) playSiren();
  }, [state?.timerExpired]);

  if (!state) return null;

  const display = getNetballScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>NETBALL · Quarter {display.quarter}</div>
      <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem', color: display.timerExpired ? '#ff4757' : '#00d4aa' }}>
        {formatTimer(display.timerSeconds)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.homeTeamId] || 'Home'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.homeScore}</div>
        </div>
        <div>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.awayTeamId] || 'Away'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.awayScore}</div>
        </div>
      </div>
    </div>
  );
}

function FootballDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<IndoorFootballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!matchId) return;
    let socket: ReturnType<typeof io> | null = null;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: IndoorFootballMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const teams = await api.teams.list(match.venueId);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
      }
    });
    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: IndoorFootballMatchState) => setState(s));
    return () => { socket?.disconnect(); };
  }, [matchId]);

  if (!state) return null;
  const display = getFootballScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>FOOTBALL · Half {display.half}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.homeTeamId] || 'Home'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.homeScore}</div>
        </div>
        <div>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.awayTeamId] || 'Away'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.awayScore}</div>
        </div>
      </div>
    </div>
  );
}

function BasketballDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<BasketballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!matchId) return;
    let socket: ReturnType<typeof io> | null = null;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: BasketballMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const teams = await api.teams.list(match.venueId);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
      }
    });
    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: BasketballMatchState) => setState(s));
    return () => { socket?.disconnect(); };
  }, [matchId]);

  useEffect(() => {
    if (state?.timerExpired) playSiren();
  }, [state?.timerExpired]);

  if (!state) return null;
  const display = getBasketballScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>BASKETBALL · Quarter {display.quarter}</div>
      <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem', color: display.timerExpired ? '#ff4757' : '#00d4aa' }}>
        {formatTimer(display.timerSeconds)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.homeTeamId] || 'Home'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.homeScore}</div>
        </div>
        <div>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.awayTeamId] || 'Away'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.awayScore}</div>
        </div>
      </div>
    </div>
  );
}

function TouchRugbyDisplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [state, setState] = useState<TouchRugbyMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!matchId) return;
    let socket: ReturnType<typeof io> | null = null;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: TouchRugbyMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const teams = await api.teams.list(match.venueId);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
      }
    });
    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: TouchRugbyMatchState) => setState(s));
    return () => { socket?.disconnect(); };
  }, [matchId]);

  useEffect(() => {
    if (state?.timerExpired) playSiren();
  }, [state?.timerExpired]);

  if (!state) return null;
  const display = getTouchRugbyScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>TOUCH RUGBY · Half {display.half}</div>
      <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem', color: display.timerExpired ? '#ff4757' : '#00d4aa' }}>
        {formatTimer(display.timerSeconds)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.homeTeamId] || 'Home'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.homeScore}</div>
        </div>
        <div>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{teamNames[display.awayTeamId] || 'Away'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900 }}>{display.awayScore}</div>
        </div>
      </div>
    </div>
  );
}
