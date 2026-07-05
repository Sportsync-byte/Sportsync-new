export interface TouchRugbyFormatConfig {
  playersPerSide: number;
  halves: number;
  halfDurationSeconds: number;
}

export const TOUCH_RUGBY_FORMAT = {
  playersPerSide: 6,
  halves: 2,
  halfDurationSeconds: 1200,
} satisfies TouchRugbyFormatConfig;

export interface TouchRugbyTryEvent {
  id: string;
  timestamp: string;
  half: number;
  scorerId: string;
  assistedById?: string;
  teamId: string;
}

export interface TouchRugbyHalfScore {
  half: number;
  homeTries: number;
  awayTries: number;
}

export interface TouchRugbyMatchState {
  matchId: string;
  fixtureId: string;
  format: TouchRugbyFormatConfig;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  currentHalf: number;
  halfScores: TouchRugbyHalfScore[];
  tryHistory: TouchRugbyTryEvent[];
  timerSeconds: number;
  timerRunning: boolean;
  timerExpired: boolean;
  status: 'not-started' | 'half-time' | 'live' | 'completed';
  winnerTeamId?: string;
}

export function createTouchRugbyMatch(
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  format: TouchRugbyFormatConfig = TOUCH_RUGBY_FORMAT
): TouchRugbyMatchState {
  return {
    matchId,
    fixtureId,
    format,
    homeTeamId,
    awayTeamId,
    homeScore: 0,
    awayScore: 0,
    currentHalf: 1,
    halfScores: [{ half: 1, homeTries: 0, awayTries: 0 }],
    tryHistory: [],
    timerSeconds: format.halfDurationSeconds,
    timerRunning: false,
    timerExpired: false,
    status: 'not-started',
  };
}
