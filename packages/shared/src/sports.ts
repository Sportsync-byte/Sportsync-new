import type { SportId } from './types.js';

export const GOAL_SPORTS = [
  'indoor-netball',
  'indoor-football',
  'basketball',
  'touch-rugby',
] as const satisfies readonly SportId[];

export type GoalSportId = (typeof GOAL_SPORTS)[number];

export function isGoalSport(sport: string): sport is GoalSportId {
  return (GOAL_SPORTS as readonly string[]).includes(sport);
}

export function goalStatLabel(sport: string): string {
  if (sport === 'basketball') return 'Points';
  if (sport === 'touch-rugby') return 'Tries';
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
