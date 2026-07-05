import type { ProductTier } from '@sportsync/shared';
import { TIER_LIMITS } from '@sportsync/shared';
import { getMaxScoreboards } from '../services/license.js';

export function enrichVenue<T extends { productTier: ProductTier; extraScoreboards?: number }>(venue: T) {
  const extra = venue.extraScoreboards ?? 0;
  return {
    ...venue,
    subscription: TIER_LIMITS[venue.productTier],
    maxScoreboards: getMaxScoreboards(venue.productTier, extra),
  };
}
