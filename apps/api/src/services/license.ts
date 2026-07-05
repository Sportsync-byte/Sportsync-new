import { TIER_LIMITS } from '@sportsync/shared';
import type { ProductTier } from '@sportsync/shared';
import { VenueModel } from '../models/venue.js';
import { ScoreboardDeviceModel } from '../models/scoreboard-device.js';

export function getMaxScoreboards(tier: ProductTier, extraScoreboards = 0): number {
  return TIER_LIMITS[tier].maxScoreboards + extraScoreboards;
}

export async function getVenueScoreboardLimit(venueId: string): Promise<number> {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return 0;
  return getMaxScoreboards(venue.productTier as ProductTier, venue.extraScoreboards ?? 0);
}

export async function countActiveScoreboards(venueId: string): Promise<number> {
  return ScoreboardDeviceModel.countDocuments({ venueId, status: 'active' });
}

export async function canActivateScoreboard(venueId: string): Promise<{ ok: boolean; error?: string }> {
  const limit = await getVenueScoreboardLimit(venueId);
  const count = await countActiveScoreboards(venueId);
  if (count >= limit) {
    return {
      ok: false,
      error: `Scoreboard limit reached (${limit}). Upgrade your plan or purchase additional scoreboard licences.`,
    };
  }
  return { ok: true };
}
