import { Schema, model } from 'mongoose';

const playerStatsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    playerId: { type: String, required: true, index: true },
    venueId: { type: String, required: true, index: true },
    competitionId: { type: String, index: true },
    matchesPlayed: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    ducks: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
  },
  { timestamps: true }
);

playerStatsSchema.index({ playerId: 1, competitionId: 1 }, { unique: true });

export const PlayerStatsModel = model('PlayerStats', playerStatsSchema);

export interface PlayerStatsDocument {
  id: string;
  playerId: string;
  venueId: string;
  competitionId?: string;
  matchesPlayed: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  ducks: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  goals: number;
  assists: number;
}
