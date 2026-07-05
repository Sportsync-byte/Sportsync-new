import type { NetballMatchState } from '@sportsync/shared';

export function startNetballMatch(state: NetballMatchState): NetballMatchState {
  const next = structuredClone(state);
  next.status = 'live';
  next.timerSeconds = next.format.quarterDurationSeconds;
  next.timerExpired = false;
  return next;
}

export function recordGoal(
  state: NetballMatchState,
  teamId: string,
  scorerId: string,
  assistedById?: string
): NetballMatchState {
  const next = structuredClone(state);
  const isHome = teamId === next.homeTeamId;

  if (isHome) next.homeScore += 1;
  else next.awayScore += 1;

  const quarter = next.quarterScores.find((q) => q.quarter === next.currentQuarter);
  if (quarter) {
    if (isHome) quarter.homeGoals += 1;
    else quarter.awayGoals += 1;
  }

  next.goalHistory.push({
    id: `goal_${Date.now()}`,
    timestamp: new Date().toISOString(),
    quarter: next.currentQuarter,
    scorerId,
    assistedById,
    teamId,
  });

  return next;
}

export function endQuarter(state: NetballMatchState): NetballMatchState {
  const next = structuredClone(state);
  if (next.currentQuarter >= next.format.quarters) {
    next.status = 'completed';
    next.timerRunning = false;
    if (next.homeScore > next.awayScore) next.winnerTeamId = next.homeTeamId;
    else if (next.awayScore > next.homeScore) next.winnerTeamId = next.awayTeamId;
    return next;
  }

  next.currentQuarter += 1;
  next.quarterScores.push({ quarter: next.currentQuarter, homeGoals: 0, awayGoals: 0 });
  next.timerSeconds = next.format.quarterDurationSeconds;
  next.timerRunning = false;
  next.timerExpired = false;
  next.status = 'quarter-break';
  return next;
}

export function getNetballScoreboard(state: NetballMatchState) {
  return {
    homeTeamId: state.homeTeamId,
    awayTeamId: state.awayTeamId,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    quarter: state.currentQuarter,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
    timerExpired: state.timerExpired,
    status: state.status,
    winnerTeamId: state.winnerTeamId,
  };
}
