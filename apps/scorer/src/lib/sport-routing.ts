import { scoringEngineSport, type SportId } from '@sportsync/shared';

export function routeScoringPage(sport: string): SportId {
  return scoringEngineSport((sport || 'indoor-cricket') as SportId);
}
