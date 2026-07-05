import type { ProductTier } from '@sportsync/shared';
import { TIER_LIMITS } from '@sportsync/shared';
import { VenueModel } from '../models/venue.js';
import { CompetitionModel } from '../models/competition.js';

export function getTierLimits(tier: ProductTier) {
  return TIER_LIMITS[tier];
}

export async function checkCanAddCompetition(venueId: string): Promise<{ ok: boolean; error?: string }> {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return { ok: false, error: 'Venue not found' };

  const tier = venue.productTier as ProductTier;
  const limits = getTierLimits(tier);
  const count = await CompetitionModel.countDocuments({ venueId, status: { $ne: 'completed' } });

  if (count >= limits.maxCompetitions) {
    return {
      ok: false,
      error: `${tier} tier allows up to ${limits.maxCompetitions} active competitions. Upgrade to Stadium for more.`,
    };
  }
  return { ok: true };
}

export async function checkCanUseSport(venueId: string, sport: string): Promise<{ ok: boolean; error?: string }> {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return { ok: false, error: 'Venue not found' };

  const tier = venue.productTier as ProductTier;
  const limits = getTierLimits(tier);
  const sports = new Set(venue.sports || []);

  if (!sports.has(sport as never) && sports.size >= limits.maxSports) {
    return {
      ok: false,
      error: `${tier} tier allows ${limits.maxSports} sport(s). Upgrade to Stadium for multi-sport.`,
    };
  }
  return { ok: true };
}

export async function checkAdvancedReporting(venueId: string): Promise<boolean> {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return false;
  return getTierLimits(venue.productTier as ProductTier).advancedReporting;
}
