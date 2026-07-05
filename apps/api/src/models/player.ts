import { Schema, model } from 'mongoose';

const playerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    displayName: { type: String, required: true },
    teamIds: [{ type: String }],
  },
  { timestamps: true }
);

export const PlayerModel = model('Player', playerSchema);

export interface PlayerDocument {
  id: string;
  venueId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  teamIds: string[];
}
