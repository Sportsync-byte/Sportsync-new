import { scoringEngineSport } from '@sportsync/shared';
import { createMatchStateForSport, matchUsesEngine } from './match-factory.js';

describe('match factory', () => {
  it('creates initial state for all sports', () => {
    const sports = [
      'indoor-cricket',
      'outdoor-cricket',
      'indoor-netball',
      'outdoor-netball',
      'indoor-football',
      'outdoor-football',
      'basketball',
      'touch-rugby',
      'rugby-union',
      'rugby-league',
    ] as const;

    for (const sport of sports) {
      const state = createMatchStateForSport(sport, 'm1', 'f1', 'home', 'away') as {
        status: string;
        matchId?: string;
        homeTeamId?: string;
        innings?: { teamId: string }[];
      };
      expect(state.status).toBe('not-started');
      expect(state.matchId ?? state.innings?.[0]?.teamId ?? state.homeTeamId).toBeTruthy();
    }
  });

  it('matches engine checks', () => {
    expect(matchUsesEngine('outdoor-football', 'indoor-football')).toBe(true);
    expect(matchUsesEngine('rugby-union', 'touch-rugby')).toBe(true);
    expect(scoringEngineSport('outdoor-netball')).toBe('indoor-netball');
  });
});
