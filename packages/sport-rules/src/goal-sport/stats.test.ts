import { aggregateGoalSportStats, mergeGoalSportSeasonStats } from './stats.js';

describe('goal sport stats', () => {
  it('aggregates weighted scoring events', () => {
    const stats = aggregateGoalSportStats([
      { scorerId: 'p1', assistedById: 'p2', weight: 2 },
      { scorerId: 'p3', weight: 3 },
    ]);
    const p1 = stats.find((s) => s.playerId === 'p1');
    const p2 = stats.find((s) => s.playerId === 'p2');
    const p3 = stats.find((s) => s.playerId === 'p3');
    expect(p1?.goals).toBe(2);
    expect(p2?.assists).toBe(1);
    expect(p3?.goals).toBe(3);
  });

  it('merges season stats', () => {
    const merged = mergeGoalSportSeasonStats(
      { playerId: 'p1', matchesPlayed: 2, goals: 5, assists: 1 },
      [{ playerId: 'p1', matchesPlayed: 1, goals: 3, assists: 2 }],
      'p1'
    );
    expect(merged.matchesPlayed).toBe(3);
    expect(merged.goals).toBe(8);
    expect(merged.assists).toBe(3);
  });
});
