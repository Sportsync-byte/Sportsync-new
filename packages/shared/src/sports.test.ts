import { goalStatLabel, isGoalSport, sortPlayerStatsBySport } from './sports.js';

describe('sports helpers', () => {
  it('identifies goal sports', () => {
    expect(isGoalSport('indoor-netball')).toBe(true);
    expect(isGoalSport('touch-rugby')).toBe(true);
    expect(isGoalSport('indoor-cricket')).toBe(false);
  });

  it('returns stat labels per sport', () => {
    expect(goalStatLabel('basketball')).toBe('Points');
    expect(goalStatLabel('touch-rugby')).toBe('Tries');
    expect(goalStatLabel('indoor-football')).toBe('Goals');
  });

  it('sorts stats by goals or runs', () => {
    const stats = [
      { playerId: 'a', runs: 10, goals: 2 },
      { playerId: 'b', runs: 50, goals: 5 },
    ];
    expect(sortPlayerStatsBySport('indoor-football', stats)[0].playerId).toBe('b');
    expect(sortPlayerStatsBySport('indoor-cricket', stats)[0].playerId).toBe('b');
  });
});
