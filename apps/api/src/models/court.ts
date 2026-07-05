import { Schema, model } from 'mongoose';
import type { SportId } from '@sportsync/shared';

const courtSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    /** Court number within the venue (1-based). Legacy DBs index venueId + number. */
    number: { type: Number, required: true },
    sport: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

courtSchema.index({ venueId: 1, number: 1 }, { unique: true });

export const CourtModel = model('Court', courtSchema);

export interface CourtDocument {
  id: string;
  venueId: string;
  name: string;
  number: number;
  sport?: SportId;
  displayOrder: number;
}
