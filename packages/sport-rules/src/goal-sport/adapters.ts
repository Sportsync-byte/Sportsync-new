import type { NetballMatchState, IndoorFootballMatchState, BasketballMatchState, TouchRugbyMatchState } from '@sportsync/shared';
import type { GoalSportScoringEvent } from './stats.js';

export function eventsFromNetballState(state: NetballMatchState): GoalSportScoringEvent[] {
  return state.goalHistory.map((goal) => ({
    scorerId: goal.scorerId,
    assistedById: goal.assistedById,
    weight: 1,
  }));
}

export function eventsFromFootballState(state: IndoorFootballMatchState): GoalSportScoringEvent[] {
  return state.goalHistory.map((goal) => ({
    scorerId: goal.scorerId,
    assistedById: goal.assistedById,
    weight: 1,
  }));
}

export function eventsFromBasketballState(state: BasketballMatchState): GoalSportScoringEvent[] {
  return state.basketHistory.map((basket) => ({
    scorerId: basket.scorerId,
    assistedById: basket.assistedById,
    weight: basket.points,
  }));
}

export function eventsFromTouchRugbyState(state: TouchRugbyMatchState): GoalSportScoringEvent[] {
  return state.tryHistory.map((tryEvent) => ({
    scorerId: tryEvent.scorerId,
    assistedById: tryEvent.assistedById,
    weight: 1,
  }));
}
