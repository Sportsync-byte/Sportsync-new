import { useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorCricketMatchState, NetballMatchState, IndoorFootballMatchState, BasketballMatchState, TouchRugbyMatchState } from '@sportsync/shared';
import { getScoreboardDisplay, getNetballScoreboard, getFootballScoreboard, getBasketballScoreboard, getTouchRugbyScoreboard } from '@sportsync/sport-rules';
import { api } from '@sportsync/api-client';
import { scoreboardApi, getDeviceMeta, clearDeviceSession } from '../lib/device';
import { enterKioskMode, isFullscreen } from '../lib/kiosk';

export function DisplayPage() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [sport, setSport] = useState<string | null>(null);
  const [idleMessage, setIdleMessage] = useState('Waiting for live match…');
  const [fullscreen, setFullscreen] = useState(isFullscreen());
  const meta = getDeviceMeta();

  useEffect(() => {
    const onChange = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const hb = await scoreboardApi.heartbeat();
        if (hb.matchId) {
          setMatchId(hb.matchId);
          setSport(hb.sport || 'indoor-cricket');
        } else {
          setMatchId(null);
          setSport(null);
          const session = await scoreboardApi.session();
          setIdleMessage(
            session.device.courtId
              ? 'No live match on your assigned court'
              : 'Assign this scoreboard to a court in the venue dashboard'
          );
        }
      } catch {
        clearDeviceSession();
        window.location.href = '/activate';
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  const kioskButton = !fullscreen ? (
    <button
      type="button"
      onClick={() => enterKioskMode()}
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        padding: '0.5rem 1rem',
        borderRadius: 8,
        border: '1px solid #2a3544',
        background: '#1a2332',
        color: '#8b9cb3',
        cursor: 'pointer',
        fontSize: '0.85rem',
        zIndex: 100,
      }}
    >
      Enter kiosk mode
    </button>
  ) : null;

  if (!matchId || !sport) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0e12', color: '#fff', textAlign: 'center', padding: '2rem' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00d4aa', marginBottom: '0.5rem' }}>SportSync</div>
          <div style={{ color: '#8b9cb3', marginBottom: '0.25rem' }}>{meta.venueName}</div>
          <div style={{ color: '#8b9cb3', fontSize: '0.9rem', marginBottom: '2rem' }}>{meta.deviceName}</div>
          <div style={{ fontSize: '1.25rem' }}>{idleMessage}</div>
          <p style={{ color: '#5a6b7d', marginTop: '1rem', fontSize: '0.85rem' }}>Connected · checking every 30s</p>
        </div>
        {kioskButton}
      </div>
    );
  }

  if (sport === 'indoor-netball') return <NetballDisplay matchId={matchId} kioskButton={kioskButton} />;
  if (sport === 'indoor-football') return <FootballDisplay matchId={matchId} kioskButton={kioskButton} />;
  if (sport === 'basketball') return <BasketballDisplay matchId={matchId} kioskButton={kioskButton} />;
  if (sport === 'touch-rugby') return <TouchRugbyDisplay matchId={matchId} kioskButton={kioskButton} />;
  return <CricketDisplay matchId={matchId} kioskButton={kioskButton} />;
}

function CricketDisplay({ matchId, kioskButton }: { matchId: string; kioskButton: ReactNode }) {
  const [state, setState] = useState<IndoorCricketMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [venueName, setVenueName] = useState('');

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;
    api.matches.get(matchId).then(async (doc) => {
      const match = doc as { state: IndoorCricketMatchState; venueId?: string };
      setState(match.state);
      if (match.venueId) {
        const [venue, teams] = await Promise.all([
          api.venues.get(match.venueId),
          api.teams.list(match.venueId),
        ]);
        setVenueName(venue.name);
        setTeamNames(Object.fromEntries(teams.map((t) => [t.id, t.name])));
      }
    });
    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket!.emit(SOCKET_EVENTS.MATCH_JOIN, matchId));
    socket.on(SOCKET_EVENTS.MATCH_STATE, (s: IndoorCricketMatchState) => setState(s));
    return () => { socket?.disconnect(); };
  }, [matchId]);

  if (!state) return null;
  const display = getScoreboardDisplay(state);
  const batting = display.battingTeam;
  const bowling = display.bowlingTeam;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1a2332 0%, #0a0e12 100%)', color: '#fff', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#7d8fa3' }}>{venueName}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#7d8fa3' }}>{teamNames[batting.teamId] || 'Batting'}</div>
          <div style={{ fontSize: '6rem', fontWeight: 900, color: '#00d4aa' }}>{batting.total}/{batting.wickets}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#7d8fa3' }}>{teamNames[bowling.teamId] || 'Bowling'}</div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>{bowling.total}/{bowling.wickets}</div>
          <div style={{ color: '#7d8fa3' }}>Over {display.current.over}.{display.current.ball}</div>
        </div>
      </div>
      {kioskButton}
    </div>
  );
}

function NetballDisplay({ matchId, kioskButton }: { matchId: string; kioskButton: ReactNode }) {
  const [state, setState] = useState<NetballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
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
    return () => { socket?.disconnect(); };
  }, [matchId]);

  if (!state) return null;
  const display = getNetballScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>NETBALL · Q{display.quarter}</div>
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
      {kioskButton}
    </div>
  );
}

function FootballDisplay({ matchId, kioskButton }: { matchId: string; kioskButton: ReactNode }) {
  const [state, setState] = useState<IndoorFootballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
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
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem' }}>
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
      {kioskButton}
    </div>
  );
}

function BasketballDisplay({ matchId, kioskButton }: { matchId: string; kioskButton: ReactNode }) {
  const [state, setState] = useState<BasketballMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
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

  if (!state) return null;
  const display = getBasketballScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>BASKETBALL · Q{display.quarter}</div>
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
      {kioskButton}
    </div>
  );
}

function TouchRugbyDisplay({ matchId, kioskButton }: { matchId: string; kioskButton: ReactNode }) {
  const [state, setState] = useState<TouchRugbyMatchState | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
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

  if (!state) return null;
  const display = getTouchRugbyScoreboard(state);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e12', color: '#fff', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#7d8fa3' }}>TOUCH RUGBY · Half {display.half}</div>
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
      {kioskButton}
    </div>
  );
}
