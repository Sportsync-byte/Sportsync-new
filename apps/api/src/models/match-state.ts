import { Schema, model } from 'mongoose';
import type { IndoorCricketMatchState } from '@sportsync/shared';

const matchStateSchema = new Schema(
  {
    matchId: { type: String, required: true, unique: true, index: true },
    fixtureId: { type: String, required: true, index: true },
    venueId: { type: String, required: true, index: true },
    sport: { type: String, required: true, default: 'indoor-cricket' },
    state: { type: Schema.Types.Mixed, required: true },
    pendingSync: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MatchStateModel = model('MatchState', matchStateSchema);

export type MatchStateDocument = {
  matchId: string;
  fixtureId: string;
  venueId: string;
  sport: string;
  state: IndoorCricketMatchState;
  pendingSync: boolean;
};
