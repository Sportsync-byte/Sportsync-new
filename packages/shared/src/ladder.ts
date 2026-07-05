import type { Fixture, LadderEntry } from './types.js';

export interface LadderPointsConfig {
  win: number;
  tie: number;
  loss: number;
  bonusPointThreshold?: number;
}

export const DEFAULT_LADDER_POINTS: LadderPointsConfig = {
  win: 4,
  tie: 2,
  loss: 0,
  bonusPointThreshold: 100,
};

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeWickets?: number;
  awayWickets?: number;
}

export function calculateLadder(
  teamIds: string[],
  results: MatchResult[],
  config: LadderPointsConfig = DEFAULT_LADDER_POINTS
): LadderEntry[] {
  const table = new Map<string, LadderEntry>();

  for (const teamId of teamIds) {
    table.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      bonusPoints: 0,
      position: 0,
    });
  }

  for (const result of results) {
    const home = table.get(result.homeTeamId);
    const away = table.get(result.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    if (result.homeScore > result.awayScore) {
      home.won += 1;
      home.points += config.win;
      away.lost += 1;
      away.points += config.loss;
    } else if (result.awayScore > result.homeScore) {
      away.won += 1;
      away.points += config.win;
      home.lost += 1;
      home.points += config.loss;
    } else {
      home.tied += 1;
      away.tied += 1;
      home.points += config.tie;
      away.points += config.tie;
    }

    if (config.bonusPointThreshold) {
      if (result.homeScore >= config.bonusPointThreshold) home.bonusPoints += 1;
      if (result.awayScore >= config.bonusPointThreshold) away.bonusPoints += 1;
    }
  }

  const entries = Array.from(table.values()).sort((a, b) => {
    const totalA = a.points + a.bonusPoints;
    const totalB = b.points + b.bonusPoints;
    if (totalB !== totalA) return totalB - totalA;
    if (b.won !== a.won) return b.won - a.won;
    return b.played - a.played;
  });

  return entries.map((entry, idx) => ({ ...entry, position: idx + 1 }));
}

export function fixtureToMatchResult(
  fixture: Fixture,
  homeScore: number,
  awayScore: number,
  homeWickets?: number,
  awayWickets?: number
): MatchResult {
  return {
    homeTeamId: fixture.homeTeamId,
    awayTeamId: fixture.awayTeamId,
    homeScore,
    awayScore,
    homeWickets,
    awayWickets,
  };
}
