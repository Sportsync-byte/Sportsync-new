import { Schema, model } from 'mongoose';
import type { AdminRole } from '@sportsync/shared';

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    venueId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'competition-manager', 'scorer', 'viewer'],
      default: 'viewer',
    },
  },
  { timestamps: true }
);

export const UserModel = model('User', userSchema);

export interface UserDocument {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  venueId: string;
  role: AdminRole;
}
