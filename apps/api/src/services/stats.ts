import type { IndoorCricketMatchState } from '@sportsync/shared';
import { aggregateMatchStats, mergeSeasonStats } from '@sportsync/sport-rules';
import { PlayerStatsModel } from '../models/player-stats.js';
import { newId } from '../utils/id.js';

export async function persistMatchStats(
  state: IndoorCricketMatchState,
  venueId: string,
  competitionId: string
): Promise<void> {
  const matchStats = aggregateMatchStats(state);
  const playerIds = new Set([
    ...matchStats.batters.map((b) => b.playerId),
    ...matchStats.bowlers.map((b) => b.playerId),
    ...matchStats.fielders.map((f) => f.playerId),
  ]);

  for (const playerId of playerIds) {
    const existing = await PlayerStatsModel.findOne({ playerId, competitionId });
    const merged = mergeSeasonStats(
      existing
        ? {
            playerId,
            matchesPlayed: existing.matchesPlayed,
            runs: existing.runs,
            ballsFaced: existing.ballsFaced,
            fours: existing.fours,
            sixes: existing.sixes,
            ducks: existing.ducks,
            wickets: existing.wickets,
            overs: existing.overs,
            runsConceded: existing.runsConceded,
            catches: existing.catches,
            runOuts: existing.runOuts,
            stumpings: existing.stumpings,
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
