import type { SportId } from '@sportsync/shared';
import {
  INDOOR_CRICKET_FORMATS,
  OUTDOOR_CRICKET_FORMAT,
  scoringEngineSport,
  netballFormatFor,
  footballFormatFor,
  rugbyFormatFor,
  BASKETBALL_FORMAT,
  createNetballMatch,
  createFootballMatch,
  createBasketballMatch,
  createTouchRugbyMatch,
} from '@sportsync/shared';
import { createMatch } from './indoor-cricket/engine.js';

export function createMatchStateForSport(
  sport: SportId,
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  formatKey?: string
): unknown {
  const engine = scoringEngineSport(sport);

  if (engine === 'indoor-netball') {
    return createNetballMatch(
      matchId,
      fixtureId,
      homeTeamId,
      awayTeamId,
      netballFormatFor(sport)
    );
  }

  if (engine === 'indoor-football') {
    return createFootballMatch(
      matchId,
      fixtureId,
      homeTeamId,
      awayTeamId,
      footballFormatFor(sport)
    );
  }

  if (engine === 'basketball') {
    return createBasketballMatch(matchId, fixtureId, homeTeamId, awayTeamId, BASKETBALL_FORMAT);
  }

  if (engine === 'touch-rugby') {
    return createTouchRugbyMatch(
      matchId,
      fixtureId,
      homeTeamId,
      awayTeamId,
      rugbyFormatFor(sport)
    );
  }

  const format =
    sport === 'outdoor-cricket'
      ? OUTDOOR_CRICKET_FORMAT
      : INDOOR_CRICKET_FORMATS[(formatKey || 'six-aside') as keyof typeof INDOOR_CRICKET_FORMATS] ??
        INDOOR_CRICKET_FORMATS['six-aside'];

  return createMatch(matchId, fixtureId, homeTeamId, awayTeamId, format);
}

export function matchUsesEngine(matchSport: string, engine: SportId): boolean {
  return scoringEngineSport(matchSport as SportId) === engine;
}
