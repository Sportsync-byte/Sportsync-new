import { Schema, model } from 'mongoose';

const scoreboardDeviceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    deviceToken: { type: String, required: true, unique: true, index: true },
    courtId: String,
    assignedMatchId: String,
    lastSeenAt: String,
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  { timestamps: true }
);

export const ScoreboardDeviceModel = model('ScoreboardDevice', scoreboardDeviceSchema);

export interface ScoreboardDeviceDocument {
  id: string;
  venueId: string;
  name: string;
  deviceToken: string;
  courtId?: string;
  assignedMatchId?: string;
  lastSeenAt?: string;
  status: 'active' | 'revoked';
}
