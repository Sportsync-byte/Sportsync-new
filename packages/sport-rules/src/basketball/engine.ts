import type { BasketballMatchState } from '@sportsync/shared';

export function startBasketballMatch(state: BasketballMatchState): BasketballMatchState {
  const next = structuredClone(state);
  next.status = 'live';
  next.timerSeconds = next.format.quarterDurationSeconds;
  next.timerExpired = false;
  return next;
}

export function recordBasket(
  state: BasketballMatchState,
  teamId: string,
  scorerId: string,
  points: 2 | 3,
  assistedById?: string
): BasketballMatchState {
  const next = structuredClone(state);
  const isHome = teamId === next.homeTeamId;

  if (isHome) next.homeScore += points;
  else next.awayScore += points;

  const quarter = next.quarterScores.find((q) => q.quarter === next.currentQuarter);
  if (quarter) {
    if (isHome) quarter.homePoints += points;
    else quarter.awayPoints += points;
  }

  next.basketHistory.push({
    id: `basket_${Date.now()}`,
    timestamp: new Date().toISOString(),
    quarter: next.currentQuarter,
    scorerId,
    assistedById,
    teamId,
    points,
  });

  return next;
}

export function endBasketballQuarter(state: BasketballMatchState): BasketballMatchState {
  const next = structuredClone(state);
  if (next.currentQuarter >= next.format.quarters) {
    next.status = 'completed';
    next.timerRunning = false;
    if (next.homeScore > next.awayScore) next.winnerTeamId = next.homeTeamId;
    else if (next.awayScore > next.homeScore) next.winnerTeamId = next.awayTeamId;
    return next;
  }

  next.currentQuarter += 1;
  next.quarterScores.push({ quarter: next.currentQuarter, homePoints: 0, awayPoints: 0 });
  next.timerSeconds = next.format.quarterDurationSeconds;
  next.timerRunning = false;
  next.timerExpired = false;
  next.status = 'quarter-break';
  return next;
}

export function undoLastBasket(state: BasketballMatchState): BasketballMatchState {
  const next = structuredClone(state);
  const basket = next.basketHistory.pop();
  if (!basket) return next;

  const isHome = basket.teamId === next.homeTeamId;
  if (isHome) next.homeScore = Math.max(0, next.homeScore - basket.points);
  else next.awayScore = Math.max(0, next.awayScore - basket.points);

  const quarter = next.quarterScores.find((q) => q.quarter === basket.quarter);
  if (quarter) {
    if (isHome) quarter.homePoints = Math.max(0, quarter.homePoints - basket.points);
    else quarter.awayPoints = Math.max(0, quarter.awayPoints - basket.points);
  }

  return next;
}

export function getBasketballScoreboard(state: BasketballMatchState) {
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
