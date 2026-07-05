import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sportsync/shared';
import type { NetballMatchState } from '@sportsync/shared';
import { createMatchSocket } from '../lib/socket';

export function useNetballSocket(matchId: string | null) {
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<NetballMatchState | null>(null);
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
    s.on(SOCKET_EVENTS.MATCH_STATE, (state: NetballMatchState) => setMatchState(state));

    return () => {
      s.emit(SOCKET_EVENTS.MATCH_LEAVE, matchId);
      s.disconnect();
    };
  }, [matchId]);

  const startMatch = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.NETBALL_START, matchId);
  }, [matchId]);

  const recordGoal = useCallback(
    (teamId: string, scorerId: string, assistedById?: string) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.NETBALL_GOAL, { matchId, teamId, scorerId, assistedById });
      }
    },
    [matchId]
  );

  const endQuarter = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.NETBALL_END_QUARTER, matchId);
  }, [matchId]);

  const undoLastGoal = useCallback(() => {
    if (matchId) socketRef.current?.emit(SOCKET_EVENTS.NETBALL_UNDO, matchId);
  }, [matchId]);

  const emitTimer = useCallback(
    (timerSeconds: number, timerRunning: boolean) => {
      if (matchId) {
        socketRef.current?.emit(SOCKET_EVENTS.NETBALL_TIMER, { matchId, timerSeconds, timerRunning });
      }
    },
    [matchId]
  );

  return { connected, matchState, startMatch, recordGoal, undoLastGoal, endQuarter, emitTimer };
}
