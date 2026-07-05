import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorFootballMatchState } from '@sportsync/shared';

export function useFootballSocket(matchId: string | null) {
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<IndoorFootballMatchState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    s.on('connect', () => {
      setConnected(true);
      s.emit(SOCKET_EVENTS.MATCH_JOIN, matchId);
    });
    s.on('disconnect', () => setConnected(false));
    s.on(SOCKET_EVENTS.MATCH_STATE, (state: IndoorFootballMatchState) => setMatchState(state));
    return () => {
      s.emit(SOCKET_EVENTS.MATCH_LEAVE, matchId);
      s.disconnect();
    };
  }, [matchId]);

  const startMatch = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.FOOTBALL_START, matchId);
  }, [matchId]);

  const recordGoal = useCallback(
    (teamId: string, scorerId: string, assistedById?: string) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.FOOTBALL_GOAL, { matchId, teamId, scorerId, assistedById });
      }
    },
    [matchId]
  );

  const endHalf = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.FOOTBALL_END_HALF, matchId);
  }, [matchId]);

  const emitTimer = useCallback(
    (timerSeconds: number, timerRunning: boolean) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.FOOTBALL_TIMER, { matchId, timerSeconds, timerRunning });
      }
    },
    [matchId]
  );

  return { connected, matchState, startMatch, recordGoal, endHalf, emitTimer };
}
