import { createNetballMatch } from '@sportsync/shared';
import { startNetballMatch, recordGoal, endQuarter, undoLastGoal } from './engine.js';

describe('indoor netball engine', () => {
  it('records goals and completes match', () => {
    let state = createNetballMatch('m1', 'f1', 'home', 'away');
    state = startNetballMatch(state);
    state = recordGoal(state, 'home', 'p1');
    state = recordGoal(state, 'away', 'p2');
    expect(state.homeScore).toBe(1);
    expect(state.awayScore).toBe(1);

    for (let q = 0; q < 4; q++) {
      if (state.status === 'quarter-break') state = startNetballMatch(state);
      state = endQuarter(state);
    }

    expect(state.status).toBe('completed');
  });

  it('undoes the last goal', () => {
    let state = createNetballMatch('m1', 'f1', 'home', 'away');
    state = startNetballMatch(state);
    state = recordGoal(state, 'home', 'p1', 'p2');
    state = recordGoal(state, 'away', 'p3');
    state = undoLastGoal(state);
    expect(state.awayScore).toBe(0);
    state = undoLastGoal(state);
    expect(state.homeScore).toBe(0);
  });
});
