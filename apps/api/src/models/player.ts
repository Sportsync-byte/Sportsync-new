import { Schema, model } from 'mongoose';

const playerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    displayName: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    phone: String,
    smsOptOut: { type: Boolean, default: false },
    /** Primary team for roster jersey number (legacy DB index: team + number). */
    team: { type: String },
    number: { type: Number },
    teamIds: [{ type: String }],
  },
  { timestamps: true }
);

playerSchema.index({ venueId: 1, slug: 1 }, { unique: true });
playerSchema.index({ team: 1, number: 1 }, { unique: true, sparse: true });

export const PlayerModel = model('Player', playerSchema);

export interface PlayerDocument {
  id: string;
  venueId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  slug: string;
  phone?: string;
  smsOptOut?: boolean;
  team?: string;
  number?: number;
  teamIds: string[];
}
