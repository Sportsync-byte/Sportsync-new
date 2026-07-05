import { Schema, model } from 'mongoose';
import type { CompetitionSettings, LadderEntry, SportId } from '@sportsync/shared';

const settingsSchema = new Schema<CompetitionSettings>(
  {
    formatKey: { type: String, enum: ['six-aside', 'eight-aside', 'asia-cup'], default: 'six-aside' },
    pointsForWin: { type: Number, default: 4 },
    pointsForTie: { type: Number, default: 2 },
    pointsForLoss: { type: Number, default: 0 },
    bonusPointThreshold: { type: Number, default: 100 },
    doubleRoundRobin: { type: Boolean, default: false },
  },
  { _id: false }
);

const ladderEntrySchema = new Schema<LadderEntry>(
  {
    teamId: String,
    played: Number,
    won: Number,
    lost: Number,
    tied: Number,
    points: Number,
    bonusPoints: Number,
    position: Number,
  },
  { _id: false }
);

const competitionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    sport: { type: String, required: true, default: 'indoor-cricket' },
    name: { type: String, required: true },
    season: { type: String, required: true },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    teamIds: [{ type: String }],
    settings: { type: settingsSchema, default: () => ({}) },
    ladder: [ladderEntrySchema],
  },
  { timestamps: true }
);

export const CompetitionModel = model('Competition', competitionSchema);

export interface CompetitionDocument {
  id: string;
  venueId: string;
  sport: SportId;
  name: string;
  season: string;
  status: 'draft' | 'active' | 'completed';
  teamIds: string[];
  settings: CompetitionSettings;
  ladder: LadderEntry[];
}
