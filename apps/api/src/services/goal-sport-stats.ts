import type { GoalSportScoringEvent } from '@sportsync/sport-rules';
import { aggregateGoalSportStats, mergeGoalSportSeasonStats } from '@sportsync/sport-rules';
import { PlayerStatsModel } from '../models/player-stats.js';
import { newId } from '../utils/id.js';

export async function persistGoalSportStats(
  events: GoalSportScoringEvent[],
  venueId: string,
  competitionId: string
): Promise<void> {
  const matchStats = aggregateGoalSportStats(events);
  const playerIds = new Set(matchStats.map((m) => m.playerId));

  for (const playerId of playerIds) {
    const existing = await PlayerStatsModel.findOne({ playerId, competitionId });
    const merged = mergeGoalSportSeasonStats(
      existing
        ? {
            playerId,
            matchesPlayed: existing.matchesPlayed,
            goals: existing.goals,
            assists: existing.assists,
          }
        : null,
      matchStats,
      playerId
    );

    await PlayerStatsModel.findOneAndUpdate(
      { playerId, competitionId },
      {
        $set: { ...merged, venueId, competitionId },
        $setOnInsert: { id: newId() },
      },
      { upsert: true }
    );
  }
}
