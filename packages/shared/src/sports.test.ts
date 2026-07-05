import { goalStatLabel, isGoalSport, sortPlayerStatsBySport } from './sports.js';

describe('sports helpers', () => {
  it('identifies goal sports including outdoor variants', () => {
    expect(isGoalSport('indoor-netball')).toBe(true);
    expect(isGoalSport('outdoor-netball')).toBe(true);
    expect(isGoalSport('rugby-union')).toBe(true);
    expect(isGoalSport('indoor-cricket')).toBe(false);
  });

  it('returns stat labels per sport', () => {
    expect(goalStatLabel('basketball')).toBe('Points');
    expect(goalStatLabel('touch-rugby')).toBe('Tries');
    expect(goalStatLabel('rugby-union')).toBe('Tries');
    expect(goalStatLabel('outdoor-football')).toBe('Goals');
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
