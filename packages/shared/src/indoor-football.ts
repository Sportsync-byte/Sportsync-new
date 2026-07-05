export interface IndoorFootballFormatConfig {
  playersPerSide: number;
  halves: number;
  halfDurationSeconds: number;
}

export const INDOOR_FOOTBALL_FORMAT = {
  playersPerSide: 5,
  halves: 2,
  halfDurationSeconds: 1200,
} satisfies IndoorFootballFormatConfig;

export interface FootballGoalEvent {
  id: string;
  timestamp: string;
  half: number;
  scorerId: string;
  assistedById?: string;
  teamId: string;
}

export interface FootballHalfScore {
  half: number;
  homeGoals: number;
  awayGoals: number;
}

export interface IndoorFootballMatchState {
  matchId: string;
  fixtureId: string;
  format: IndoorFootballFormatConfig;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  currentHalf: number;
  halfScores: FootballHalfScore[];
  goalHistory: FootballGoalEvent[];
  timerSeconds: number;
  timerRunning: boolean;
  timerExpired: boolean;
  status: 'not-started' | 'half-time' | 'live' | 'completed';
  winnerTeamId?: string;
}

export function createFootballMatch(
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  format: IndoorFootballFormatConfig = INDOOR_FOOTBALL_FORMAT
): IndoorFootballMatchState {
  return {
    matchId,
    fixtureId,
    format,
    homeTeamId,
    awayTeamId,
    homeScore: 0,
    awayScore: 0,
    currentHalf: 1,
    halfScores: [{ half: 1, homeGoals: 0, awayGoals: 0 }],
    goalHistory: [],
    timerSeconds: format.halfDurationSeconds,
    timerRunning: false,
    timerExpired: false,
    status: 'not-started',
  };
}
