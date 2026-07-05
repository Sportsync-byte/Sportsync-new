import type { NetballMatchState } from '@sportsync/shared';

export interface NetballPlayerMatchStats {
  playerId: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export function aggregateNetballStats(state: NetballMatchState): NetballPlayerMatchStats[] {
  const map = new Map<string, NetballPlayerMatchStats>();

  const ensure = (id: string) => {
    if (!map.has(id)) {
      map.set(id, { playerId: id, goals: 0, assists: 0, matchesPlayed: 0 });
    }
    return map.get(id)!;
  };

  const scorers = new Set<string>();
  for (const goal of state.goalHistory) {
    const scorer = ensure(goal.scorerId);
    scorer.goals += 1;
    scorers.add(goal.scorerId);
    if (goal.assistedById) {
      ensure(goal.assistedById).assists += 1;
    }
  }

  for (const id of scorers) {
    ensure(id).matchesPlayed = 1;
  }

  return Array.from(map.values());
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
  const m = match.find((x) => x.playerId === playerId);
  const base = existing ?? { playerId, matchesPlayed: 0, goals: 0, assists: 0 };
  if (!m) return base;
  return {
    playerId,
    matchesPlayed: base.matchesPlayed + 1,
    goals: base.goals + m.goals,
    assists: base.assists + m.assists,
  };
}
