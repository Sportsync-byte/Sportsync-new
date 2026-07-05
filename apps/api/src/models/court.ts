import { Schema, model } from 'mongoose';
import type { SportId } from '@sportsync/shared';

const courtSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sport: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CourtModel = model('Court', courtSchema);

export interface CourtDocument {
  id: string;
  venueId: string;
  name: string;
  sport?: SportId;
  displayOrder: number;
}
