import { Schema, model } from 'mongoose';
import type { VenueBranding, ProductTier, SportId } from '@sportsync/shared';

const brandingSchema = new Schema<VenueBranding>(
  {
    primaryColor: { type: String, default: '#00c896' },
    secondaryColor: { type: String, default: '#1a2332' },
    logoUrl: String,
    sponsorBannerUrl: String,
    scoreboardTheme: String,
  },
  { _id: false }
);

const venueSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    productTier: { type: String, enum: ['club', 'stadium'], default: 'club' },
    branding: { type: brandingSchema, default: () => ({}) },
    courtCount: { type: Number, default: 1 },
    sports: [{ type: String }],
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    billingStatus: { type: String, enum: ['none', 'active', 'past_due', 'canceled'], default: 'none' },
  },
  { timestamps: true }
);

export const VenueModel = model('Venue', venueSchema);

export interface VenueDocument {
  id: string;
  name: string;
  slug: string;
  productTier: ProductTier;
  branding: VenueBranding;
  courtCount: number;
  sports: SportId[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingStatus?: 'none' | 'active' | 'past_due' | 'canceled';
}
