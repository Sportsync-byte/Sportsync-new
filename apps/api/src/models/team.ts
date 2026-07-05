import { Schema, model } from 'mongoose';

const teamSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    shortName: String,
    colors: {
      primary: { type: String, default: '#00c896' },
      secondary: { type: String, default: '#ffffff' },
    },
    logoUrl: String,
    captainId: String,
    coachId: String,
  },
  { timestamps: true }
);

export const TeamModel = model('Team', teamSchema);

export interface TeamDocument {
  id: string;
  venueId: string;
  name: string;
  shortName?: string;
  colors: { primary: string; secondary: string };
  logoUrl?: string;
  captainId?: string;
  coachId?: string;
}
