import { createNetballMatch } from '@sportsync/shared';
import { startNetballMatch, recordGoal, endQuarter } from './engine.js';
import { aggregateNetballStats, mergeNetballSeasonStats } from './stats.js';

describe('indoor netball stats', () => {
  it('aggregates goals and assists per player', () => {
    let state = createNetballMatch('m1', 'f1', 'home', 'away');
    state = startNetballMatch(state);
    state = recordGoal(state, 'home', 'p1', 'p2');
    state = recordGoal(state, 'home', 'p1');
    state = recordGoal(state, 'away', 'p3');

    const stats = aggregateNetballStats(state);
    const p1 = stats.find((s) => s.playerId === 'p1');
    const p2 = stats.find((s) => s.playerId === 'p2');
    const p3 = stats.find((s) => s.playerId === 'p3');

    expect(p1?.goals).toBe(2);
    expect(p1?.assists).toBe(0);
    expect(p1?.matchesPlayed).toBe(1);
    expect(p2?.assists).toBe(1);
    expect(p3?.goals).toBe(1);
  });

  it('merges season stats across matches', () => {
    const match = [
      { playerId: 'p1', goals: 3, assists: 1, matchesPlayed: 1 },
      { playerId: 'p2', goals: 0, assists: 2, matchesPlayed: 0 },
    ];
    const merged = mergeNetballSeasonStats(
      { playerId: 'p1', matchesPlayed: 2, goals: 5, assists: 0 },
      match,
      'p1'
    );
    expect(merged).toEqual({ playerId: 'p1', matchesPlayed: 3, goals: 8, assists: 1 });
  });
});
