import type { NetballMatchState } from '@sportsync/shared';
import {
  aggregateGoalSportStats,
  mergeGoalSportSeasonStats,
  eventsFromNetballState,
} from '../goal-sport/index.js';

export interface NetballPlayerMatchStats {
  playerId: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export function aggregateNetballStats(state: NetballMatchState): NetballPlayerMatchStats[] {
  return aggregateGoalSportStats(eventsFromNetballState(state));
}

export interface NetballSeasonStats {
  playerId: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
}

export function mergeNetballSeasonStats(
  existing: NetballSeasonStats | null,
  match: NetballPlayerMatchStats[],
  playerId: string
): NetballSeasonStats {
  return mergeGoalSportSeasonStats(existing, match, playerId);
}
