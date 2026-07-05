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
    teamIds: [{ type: String }],
  },
  { timestamps: true }
);

playerSchema.index({ venueId: 1, slug: 1 }, { unique: true });

export const PlayerModel = model('Player', playerSchema);

export interface PlayerDocument {
  id: string;
  venueId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  slug: string;
  phone?: string;
  teamIds: string[];
}
