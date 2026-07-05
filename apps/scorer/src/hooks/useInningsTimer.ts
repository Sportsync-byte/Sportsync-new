import { useEffect, useRef } from 'react';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { playSiren } from '../lib/siren';

interface UseInningsTimerOptions {
  matchId: string;
  matchState: IndoorCricketMatchState | null;
  connected: boolean;
  emitTimer: (timerSeconds: number, timerRunning: boolean) => void;
}

export function useInningsTimer({ matchId, matchState, connected, emitTimer }: UseInningsTimerOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sirenPlayedRef = useRef(false);

  const innings = matchState?.innings[matchState.battingTeamIndex];

  useEffect(() => {
    sirenPlayedRef.current = false;
  }, [matchState?.battingTeamIndex, matchState?.status]);

  useEffect(() => {
    if (innings?.timerExpired && !sirenPlayedRef.current) {
      sirenPlayedRef.current = true;
      playSiren();
    }
  }, [innings?.timerExpired]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!innings?.timerRunning || !connected) return;

    intervalRef.current = setInterval(() => {
      const current = innings.timerSeconds;
      if (current <= 0) return;
      emitTimer(current - 1, true);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [innings?.timerRunning, innings?.timerSeconds, connected, emitTimer, matchId]);

  const start = () => {
    if (!innings) return;
    emitTimer(innings.timerSeconds, true);
  };

  const pause = () => {
    if (!innings) return;
    emitTimer(innings.timerSeconds, false);
  };

  const reset = () => {
    if (!matchState) return;
    const duration = matchState.format.inningsDurationSeconds;
    emitTimer(duration, false);
  };

  return { start, pause, reset, innings };
}
