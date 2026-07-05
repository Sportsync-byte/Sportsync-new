import type { ProductTier } from '@sportsync/shared';
import { TIER_LIMITS } from '@sportsync/shared';

export function enrichVenue<T extends { productTier: ProductTier }>(venue: T) {
  return {
    ...venue,
    subscription: TIER_LIMITS[venue.productTier],
  };
}
