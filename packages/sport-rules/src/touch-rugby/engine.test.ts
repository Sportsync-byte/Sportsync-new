import { createTouchRugbyMatch } from '@sportsync/shared';
import {
  startTouchRugbyMatch,
  recordTouchRugbyTry,
  endTouchRugbyHalf,
  undoLastTouchRugbyTry,
} from './engine.js';

describe('touch rugby engine', () => {
  it('records tries and completes match', () => {
    let state = createTouchRugbyMatch('m1', 'f1', 'home', 'away');
    state = startTouchRugbyMatch(state);
    state = recordTouchRugbyTry(state, 'home', 'p1');
    state = recordTouchRugbyTry(state, 'away', 'p2');
    expect(state.homeScore).toBe(1);
    expect(state.awayScore).toBe(1);

    state = endTouchRugbyHalf(state);
    state = startTouchRugbyMatch(state);
    state = recordTouchRugbyTry(state, 'home', 'p1');
    state = endTouchRugbyHalf(state);

    expect(state.status).toBe('completed');
    expect(state.winnerTeamId).toBe('home');
  });

  it('undoes the last try', () => {
    let state = createTouchRugbyMatch('m1', 'f1', 'home', 'away');
    state = startTouchRugbyMatch(state);
    state = recordTouchRugbyTry(state, 'home', 'p1');
    state = undoLastTouchRugbyTry(state);
    expect(state.homeScore).toBe(0);
  });
});
