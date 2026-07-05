export interface GoalSportScoringEvent {
  scorerId: string;
  assistedById?: string;
  weight?: number;
}

export interface GoalSportPlayerMatchStats {
  playerId: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export function aggregateGoalSportStats(events: GoalSportScoringEvent[]): GoalSportPlayerMatchStats[] {
  const map = new Map<string, GoalSportPlayerMatchStats>();

  const ensure = (id: string) => {
    if (!map.has(id)) {
      map.set(id, { playerId: id, goals: 0, assists: 0, matchesPlayed: 0 });
    }
    return map.get(id)!;
  };

  const scorers = new Set<string>();
  for (const event of events) {
    const weight = event.weight ?? 1;
    const scorer = ensure(event.scorerId);
    scorer.goals += weight;
    scorers.add(event.scorerId);
    if (event.assistedById) {
      ensure(event.assistedById).assists += 1;
    }
  }

  for (const id of scorers) {
    ensure(id).matchesPlayed = 1;
  }

  return Array.from(map.values());
}

export interface GoalSportSeasonStats {
  playerId: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
}

export function mergeGoalSportSeasonStats(
  existing: GoalSportSeasonStats | null,
  match: GoalSportPlayerMatchStats[],
  playerId: string
): GoalSportSeasonStats {
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
