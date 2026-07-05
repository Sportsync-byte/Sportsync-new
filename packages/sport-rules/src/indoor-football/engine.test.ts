import { createFootballMatch } from '@sportsync/shared';
import { startFootballMatch, recordFootballGoal, endFootballHalf } from './engine.js';

describe('indoor football engine', () => {
  it('records goals and completes match after two halves', () => {
    let state = createFootballMatch('m1', 'f1', 'home', 'away');
    state = startFootballMatch(state);
    state = recordFootballGoal(state, 'home', 'p1');
    state = recordFootballGoal(state, 'away', 'p2', 'p3');
    expect(state.homeScore).toBe(1);
    expect(state.awayScore).toBe(1);

    state = endFootballHalf(state);
    expect(state.status).toBe('half-time');
    expect(state.currentHalf).toBe(2);

    state = startFootballMatch(state);
    state = recordFootballGoal(state, 'home', 'p1');
    state = endFootballHalf(state);

    expect(state.status).toBe('completed');
    expect(state.winnerTeamId).toBe('home');
    expect(state.homeScore).toBe(2);
    expect(state.awayScore).toBe(1);
  });

  it('ends in draw when scores are equal', () => {
    let state = createFootballMatch('m1', 'f1', 'home', 'away');
    state = startFootballMatch(state);
    state = recordFootballGoal(state, 'home', 'p1');
    state = endFootballHalf(state);
    state = startFootballMatch(state);
    state = recordFootballGoal(state, 'away', 'p2');
    state = endFootballHalf(state);

    expect(state.status).toBe('completed');
    expect(state.winnerTeamId).toBeUndefined();
  });
});
