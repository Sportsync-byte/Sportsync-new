import type { SportId } from './types.js';
import { scoringEngineSport } from './sport-registry.js';

export const GOAL_SPORTS = [
  'indoor-netball',
  'indoor-football',
  'basketball',
  'touch-rugby',
] as const satisfies readonly SportId[];

export type GoalSportId = (typeof GOAL_SPORTS)[number];

export function isGoalSport(sport: string): boolean {
  return (GOAL_SPORTS as readonly string[]).includes(scoringEngineSport(sport as SportId));
}

export function goalStatLabel(sport: string): string {
  if (sport === 'basketball') return 'Points';
  if (sport === 'touch-rugby' || sport === 'rugby-union' || sport === 'rugby-league') return 'Tries';
  return 'Goals';
}

export function sortPlayerStatsBySport<T extends { runs: number; goals: number }>(
  sport: string,
  stats: T[]
): T[] {
  if (isGoalSport(sport)) {
    return [...stats].sort((a, b) => b.goals - a.goals);
  }
  return [...stats].sort((a, b) => b.runs - a.runs);
}
