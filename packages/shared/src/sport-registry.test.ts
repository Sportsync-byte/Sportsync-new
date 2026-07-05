import {
  scoringEngineSport,
  sportDisplayName,
  footballFormatFor,
  netballFormatFor,
  rugbyFormatFor,
  OUTDOOR_CRICKET_FORMAT,
  COMPETITION_SPORTS,
} from './sport-registry.js';

describe('sport registry', () => {
  it('maps outdoor and rugby sports to scoring engines', () => {
    expect(scoringEngineSport('outdoor-football')).toBe('indoor-football');
    expect(scoringEngineSport('rugby-union')).toBe('touch-rugby');
    expect(scoringEngineSport('basketball')).toBe('basketball');
  });

  it('lists all competition sports', () => {
    expect(COMPETITION_SPORTS.length).toBe(10);
  });

  it('provides display names', () => {
    expect(sportDisplayName('rugby-league')).toBe('Rugby League');
    expect(sportDisplayName('outdoor-netball')).toBe('Outdoor Netball');
  });

  it('selects outdoor formats', () => {
    expect(footballFormatFor('outdoor-football').playersPerSide).toBe(11);
    expect(netballFormatFor('outdoor-netball').quarterDurationSeconds).toBe(900);
    expect(rugbyFormatFor('rugby-union').playersPerSide).toBe(15);
    expect(OUTDOOR_CRICKET_FORMAT.totalOvers).toBe(20);
  });
});
