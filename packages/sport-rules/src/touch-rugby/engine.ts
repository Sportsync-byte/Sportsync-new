import type { TouchRugbyMatchState } from '@sportsync/shared';

export function startTouchRugbyMatch(state: TouchRugbyMatchState): TouchRugbyMatchState {
  const next = structuredClone(state);
  next.status = 'live';
  next.timerSeconds = next.format.halfDurationSeconds;
  next.timerExpired = false;
  return next;
}

export function recordTouchRugbyTry(
  state: TouchRugbyMatchState,
  teamId: string,
  scorerId: string,
  assistedById?: string
): TouchRugbyMatchState {
  const next = structuredClone(state);
  const isHome = teamId === next.homeTeamId;
  if (isHome) next.homeScore += 1;
  else next.awayScore += 1;

  const half = next.halfScores.find((h) => h.half === next.currentHalf);
  if (half) {
    if (isHome) half.homeTries += 1;
    else half.awayTries += 1;
  }

  next.tryHistory.push({
    id: `try_${Date.now()}`,
    timestamp: new Date().toISOString(),
    half: next.currentHalf,
    scorerId,
    assistedById,
    teamId,
  });
  return next;
}

export function undoLastTouchRugbyTry(state: TouchRugbyMatchState): TouchRugbyMatchState {
  const next = structuredClone(state);
  const tryEvent = next.tryHistory.pop();
  if (!tryEvent) return next;

  const isHome = tryEvent.teamId === next.homeTeamId;
  if (isHome) next.homeScore = Math.max(0, next.homeScore - 1);
  else next.awayScore = Math.max(0, next.awayScore - 1);

  const half = next.halfScores.find((h) => h.half === tryEvent.half);
  if (half) {
    if (isHome) half.homeTries = Math.max(0, half.homeTries - 1);
    else half.awayTries = Math.max(0, half.awayTries - 1);
  }
  return next;
}

export function endTouchRugbyHalf(state: TouchRugbyMatchState): TouchRugbyMatchState {
  const next = structuredClone(state);
  if (next.currentHalf >= next.format.halves) {
    next.status = 'completed';
    next.timerRunning = false;
    if (next.homeScore > next.awayScore) next.winnerTeamId = next.homeTeamId;
    else if (next.awayScore > next.homeScore) next.winnerTeamId = next.awayTeamId;
    return next;
  }
  next.currentHalf += 1;
  next.halfScores.push({ half: next.currentHalf, homeTries: 0, awayTries: 0 });
  next.timerSeconds = next.format.halfDurationSeconds;
  next.timerRunning = false;
  next.timerExpired = false;
  next.status = 'half-time';
  return next;
}

export function getTouchRugbyScoreboard(state: TouchRugbyMatchState) {
  return {
    homeTeamId: state.homeTeamId,
    awayTeamId: state.awayTeamId,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    half: state.currentHalf,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
    timerExpired: state.timerExpired,
    status: state.status,
    winnerTeamId: state.winnerTeamId,
  };
}
