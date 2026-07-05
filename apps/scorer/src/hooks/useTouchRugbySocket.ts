import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { TouchRugbyMatchState } from '@sportsync/shared';
import { createMatchSocket } from '../lib/socket';

export function useTouchRugbySocket(matchId: string | null) {
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<TouchRugbyMatchState | null>(null);
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
    s.on(SOCKET_EVENTS.MATCH_STATE, (state: TouchRugbyMatchState) => setMatchState(state));
    return () => {
      s.emit(SOCKET_EVENTS.MATCH_LEAVE, matchId);
      s.disconnect();
    };
  }, [matchId]);

  const startMatch = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.TOUCH_RUGBY_START, matchId);
  }, [matchId]);

  const recordTry = useCallback(
    (teamId: string, scorerId: string, assistedById?: string) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.TOUCH_RUGBY_TRY, { matchId, teamId, scorerId, assistedById });
      }
    },
    [matchId]
  );

  const endHalf = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.TOUCH_RUGBY_END_HALF, matchId);
  }, [matchId]);

  const undoLastTry = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.TOUCH_RUGBY_UNDO, matchId);
  }, [matchId]);

  const emitTimer = useCallback(
    (timerSeconds: number, timerRunning: boolean) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.TOUCH_RUGBY_TIMER, { matchId, timerSeconds, timerRunning });
      }
    },
    [matchId]
  );

  return { connected, matchState, startMatch, recordTry, undoLastTry, endHalf, emitTimer };
}
