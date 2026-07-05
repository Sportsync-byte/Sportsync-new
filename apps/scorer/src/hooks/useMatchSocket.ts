import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { syncPendingBalls, queueBall } from '../lib/offline-queue';

export function useMatchSocket(matchId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<IndoorCricketMatchState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const s = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', async () => {
      setConnected(true);
      s.emit(SOCKET_EVENTS.MATCH_JOIN, matchId);
      await syncPendingBalls(matchId, (ball) => {
        s.emit(SOCKET_EVENTS.MATCH_BALL, { matchId, ball });
      });
    });

    s.on('disconnect', () => setConnected(false));
    s.on(SOCKET_EVENTS.MATCH_STATE, (state: IndoorCricketMatchState) => setMatchState(state));

    setSocket(s);

    return () => {
      s.emit(SOCKET_EVENTS.MATCH_LEAVE, matchId);
      s.disconnect();
    };
  }, [matchId]);

  const emitBall = useCallback(
    async (ball: unknown) => {
      if (!matchId) return;
      if (socketRef.current?.connected) {
        socketRef.current.emit(SOCKET_EVENTS.MATCH_BALL, { matchId, ball });
      } else {
        await queueBall(matchId, ball);
      }
    },
    [matchId]
  );

  const emitSetup = useCallback(
    (payload: unknown) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(SOCKET_EVENTS.MATCH_SETUP, payload);
      }
    },
    []
  );

  const emitUndo = useCallback(() => {
    if (matchId && socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.MATCH_UNDO, matchId);
    }
  }, [matchId]);

  return { socket, connected, matchState, emitBall, emitSetup, emitUndo };
}
