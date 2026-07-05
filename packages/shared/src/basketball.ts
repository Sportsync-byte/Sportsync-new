export interface BasketballFormatConfig {
  playersPerSide: number;
  quarters: number;
  quarterDurationSeconds: number;
}

export const BASKETBALL_FORMAT = {
  playersPerSide: 5,
  quarters: 4,
  quarterDurationSeconds: 600,
} satisfies BasketballFormatConfig;

export interface BasketballBasketEvent {
  id: string;
  timestamp: string;
  quarter: number;
  scorerId: string;
  assistedById?: string;
  teamId: string;
  points: 2 | 3;
}

export interface BasketballQuarterScore {
  quarter: number;
  homePoints: number;
  awayPoints: number;
}

export interface BasketballMatchState {
  matchId: string;
  fixtureId: string;
  format: BasketballFormatConfig;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  quarterScores: BasketballQuarterScore[];
  basketHistory: BasketballBasketEvent[];
  timerSeconds: number;
  timerRunning: boolean;
  timerExpired: boolean;
  status: 'not-started' | 'quarter-break' | 'live' | 'completed';
  winnerTeamId?: string;
}

export function createBasketballMatch(
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  format: BasketballFormatConfig = BASKETBALL_FORMAT
): BasketballMatchState {
  return {
    matchId,
    fixtureId,
    format,
    homeTeamId,
    awayTeamId,
    homeScore: 0,
    awayScore: 0,
    currentQuarter: 1,
    quarterScores: [{ quarter: 1, homePoints: 0, awayPoints: 0 }],
    basketHistory: [],
    timerSeconds: format.quarterDurationSeconds,
    timerRunning: false,
    timerExpired: false,
    status: 'not-started',
  };
}
