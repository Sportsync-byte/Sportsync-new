import { createBasketballMatch } from '@sportsync/shared';
import { startBasketballMatch, recordBasket, endBasketballQuarter, undoLastBasket } from './engine.js';

describe('basketball engine', () => {
  it('records baskets and completes match', () => {
    let state = createBasketballMatch('m1', 'f1', 'home', 'away');
    state = startBasketballMatch(state);
    state = recordBasket(state, 'home', 'p1', 2);
    state = recordBasket(state, 'away', 'p2', 3, 'p3');
    expect(state.homeScore).toBe(2);
    expect(state.awayScore).toBe(3);

    for (let q = 0; q < 4; q++) {
      if (state.status === 'quarter-break') state = startBasketballMatch(state);
      state = endBasketballQuarter(state);
    }

    expect(state.status).toBe('completed');
  });

  it('undoes the last basket', () => {
    let state = createBasketballMatch('m1', 'f1', 'home', 'away');
    state = startBasketballMatch(state);
    state = recordBasket(state, 'home', 'p1', 3);
    state = recordBasket(state, 'away', 'p2', 2);
    state = undoLastBasket(state);
    expect(state.awayScore).toBe(0);
    state = undoLastBasket(state);
    expect(state.homeScore).toBe(0);
  });
});
