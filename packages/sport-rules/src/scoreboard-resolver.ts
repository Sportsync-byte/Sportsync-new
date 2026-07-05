import type {
  SportId,
  IndoorCricketMatchState,
  NetballMatchState,
  IndoorFootballMatchState,
  BasketballMatchState,
  TouchRugbyMatchState,
} from '@sportsync/shared';
import { scoringEngineSport } from '@sportsync/shared';
import { getScoreboardDisplay } from './indoor-cricket/engine.js';
import { getNetballScoreboard } from './indoor-netball/engine.js';
import { getFootballScoreboard } from './indoor-football/engine.js';
import { getBasketballScoreboard } from './basketball/engine.js';
import { getTouchRugbyScoreboard } from './touch-rugby/engine.js';

export function getScoreboardForMatch(sport: SportId, state: unknown) {
  const engine = scoringEngineSport(sport);
  switch (engine) {
    case 'indoor-netball':
      return getNetballScoreboard(state as NetballMatchState);
    case 'indoor-football':
      return getFootballScoreboard(state as IndoorFootballMatchState);
    case 'basketball':
      return getBasketballScoreboard(state as BasketballMatchState);
    case 'touch-rugby':
      return getTouchRugbyScoreboard(state as TouchRugbyMatchState);
    default:
      return getScoreboardDisplay(state as IndoorCricketMatchState);
  }
}
