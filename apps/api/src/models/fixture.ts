import { Schema, model } from 'mongoose';

const fixtureSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    competitionId: { type: String, required: true, index: true },
    gradeId: { type: String, default: 'default' },
    round: { type: Number, required: true },
    courtId: String,
    homeTeamId: { type: String, required: true },
    awayTeamId: { type: String, required: true },
    scheduledAt: String,
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'abandoned'],
      default: 'scheduled',
    },
    matchId: String,
    homeScore: Number,
    awayScore: Number,
    homeWickets: Number,
    awayWickets: Number,
    winnerTeamId: String,
  },
  { timestamps: true }
);

export const FixtureModel = model('Fixture', fixtureSchema);

export interface FixtureDocument {
  id: string;
  venueId: string;
  competitionId: string;
  gradeId: string;
  round: number;
  courtId?: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt?: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
  homeWickets?: number;
  awayWickets?: number;
  winnerTeamId?: string;
}
