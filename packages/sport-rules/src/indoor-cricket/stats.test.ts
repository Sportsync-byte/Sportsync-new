import { createMatch, setBatters, setBowler, recordBall } from './engine.js';
import { aggregateMatchStats } from './stats.js';
import { INDOOR_CRICKET_FORMATS } from '@sportsync/shared';

describe('indoor cricket stats', () => {
  it('aggregates batting and bowling stats from ball history', () => {
    const format = INDOOR_CRICKET_FORMATS['six-aside'];
    let state = createMatch('m1', 'f1', 'team-home', 'team-away', format);
    state = setBatters(state, 'b1', 'b2');
    state = setBowler(state, 'bowler-1');

    state = recordBall(state, { runs: 4 });
    state = recordBall(state, { runs: 6 });
    state = recordBall(state, {
      runs: 0,
      dismissal: { type: 'caught', batterId: 'b1', fielderId: 'f1' },
    });

    const stats = aggregateMatchStats(state);
    const b1 = stats.batters.find((b) => b.playerId === 'b1');
    const bowler = stats.bowlers.find((b) => b.playerId === 'bowler-1');
    const fielder = stats.fielders.find((f) => f.playerId === 'f1');

    expect(b1?.runs).toBe(5);
    expect(b1?.fours).toBe(1);
    expect(b1?.isOut).toBe(true);
    expect(bowler?.wickets).toBe(1);
    expect(fielder?.catches).toBe(1);
  });
});
