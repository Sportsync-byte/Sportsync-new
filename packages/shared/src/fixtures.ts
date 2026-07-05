import type { Fixture } from './types.js';

export type FixtureScheduleType = 'round-robin' | 'double-round-robin';

export function generateRoundRobinFixtures(
  teamIds: string[],
  competitionId: string,
  gradeId: string,
  options?: { doubleRoundRobin?: boolean; startDate?: string; daysBetweenRounds?: number }
): Omit<Fixture, 'id'>[] {
  if (teamIds.length < 2) return [];

  const fixtures: Omit<Fixture, 'id'>[] = [];
  const teams = [...teamIds];
  const hasBye = teams.length % 2 === 1;
  if (hasBye) teams.push('__bye__');

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  let rotation = [...teams];

  const baseDate = options?.startDate ? new Date(options.startDate) : new Date();
  const daysBetween = options?.daysBetweenRounds ?? 7;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];
      if (home === '__bye__' || away === '__bye__') continue;

      const scheduledAt = new Date(baseDate);
      scheduledAt.setDate(scheduledAt.getDate() + round * daysBetween);

      fixtures.push({
        competitionId,
        gradeId,
        round: round + 1,
        homeTeamId: home,
        awayTeamId: away,
        scheduledAt: scheduledAt.toISOString(),
        status: 'scheduled',
      });
    }

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop()!);
    rotation = [fixed, ...rest];
  }

  if (options?.doubleRoundRobin) {
    const returnFixtures = fixtures.map((f) => {
      const returnRound = rounds + f.round!;
      const scheduledAt = new Date(baseDate);
      scheduledAt.setDate(scheduledAt.getDate() + (returnRound - 1) * daysBetween);
      return {
        ...f,
        round: returnRound,
        homeTeamId: f.awayTeamId,
        awayTeamId: f.homeTeamId,
        scheduledAt: scheduledAt.toISOString(),
      };
    });
    fixtures.push(...returnFixtures);
  }

  return fixtures;
}
