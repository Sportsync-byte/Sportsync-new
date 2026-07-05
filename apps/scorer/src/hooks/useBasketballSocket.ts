import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { BasketballMatchState } from '@sportsync/shared';
import { createMatchSocket } from '../lib/socket';

export function useBasketballSocket(matchId: string | null) {
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<BasketballMatchState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const s = createMatchSocket();
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      s.emit(SOCKET_EVENTS.MATCH_JOIN, matchId);
    });
    s.on('disconnect', () => setConnected(false));
    s.on(SOCKET_EVENTS.MATCH_STATE, (state: BasketballMatchState) => setMatchState(state));

    return () => {
      s.emit(SOCKET_EVENTS.MATCH_LEAVE, matchId);
      s.disconnect();
    };
  }, [matchId]);

  const startMatch = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.BASKETBALL_START, matchId);
  }, [matchId]);

  const recordBasket = useCallback(
    (teamId: string, scorerId: string, points: 2 | 3, assistedById?: string) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.BASKETBALL_BASKET, { matchId, teamId, scorerId, points, assistedById });
      }
    },
    [matchId]
  );

  const endQuarter = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.BASKETBALL_END_QUARTER, matchId);
  }, [matchId]);

  const undoLastBasket = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.BASKETBALL_UNDO, matchId);
  }, [matchId]);

  const emitTimer = useCallback(
    (timerSeconds: number, timerRunning: boolean) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.BASKETBALL_TIMER, { matchId, timerSeconds, timerRunning });
      }
    },
    [matchId]
  );

  return { connected, matchState, startMatch, recordBasket, undoLastBasket, endQuarter, emitTimer };
}
