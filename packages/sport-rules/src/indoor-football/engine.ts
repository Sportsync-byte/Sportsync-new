import type { IndoorFootballMatchState } from '@sportsync/shared';

export function startFootballMatch(state: IndoorFootballMatchState): IndoorFootballMatchState {
  const next = structuredClone(state);
  next.status = 'live';
  next.timerSeconds = next.format.halfDurationSeconds;
  next.timerExpired = false;
  return next;
}

export function recordFootballGoal(
  state: IndoorFootballMatchState,
  teamId: string,
  scorerId: string,
  assistedById?: string
): IndoorFootballMatchState {
  const next = structuredClone(state);
  const isHome = teamId === next.homeTeamId;
  if (isHome) next.homeScore += 1;
  else next.awayScore += 1;

  const half = next.halfScores.find((h) => h.half === next.currentHalf);
  if (half) {
    if (isHome) half.homeGoals += 1;
    else half.awayGoals += 1;
  }

  next.goalHistory.push({
    id: `goal_${Date.now()}`,
    timestamp: new Date().toISOString(),
    half: next.currentHalf,
    scorerId,
    assistedById,
    teamId,
  });
  return next;
}

export function endFootballHalf(state: IndoorFootballMatchState): IndoorFootballMatchState {
  const next = structuredClone(state);
  if (next.currentHalf >= next.format.halves) {
    next.status = 'completed';
    next.timerRunning = false;
    if (next.homeScore > next.awayScore) next.winnerTeamId = next.homeTeamId;
    else if (next.awayScore > next.homeScore) next.winnerTeamId = next.awayTeamId;
    return next;
  }
  next.currentHalf += 1;
  next.halfScores.push({ half: next.currentHalf, homeGoals: 0, awayGoals: 0 });
  next.timerSeconds = next.format.halfDurationSeconds;
  next.timerRunning = false;
  next.timerExpired = false;
  next.status = 'half-time';
  return next;
}

export function getFootballScoreboard(state: IndoorFootballMatchState) {
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
