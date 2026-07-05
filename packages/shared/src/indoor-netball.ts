export interface IndoorNetballFormatConfig {
  playersPerSide: number;
  quarters: number;
  quarterDurationSeconds: number;
  goalsToWin?: number;
}

export const INDOOR_NETBALL_FORMAT = {
  playersPerSide: 7,
  quarters: 4,
  quarterDurationSeconds: 600,
} satisfies IndoorNetballFormatConfig;

export interface NetballGoalEvent {
  id: string;
  timestamp: string;
  quarter: number;
  scorerId: string;
  assistedById?: string;
  teamId: string;
}

export interface NetballQuarterScore {
  quarter: number;
  homeGoals: number;
  awayGoals: number;
}

export interface NetballMatchState {
  matchId: string;
  fixtureId: string;
  format: IndoorNetballFormatConfig;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  quarterScores: NetballQuarterScore[];
  goalHistory: NetballGoalEvent[];
  timerSeconds: number;
  timerRunning: boolean;
  timerExpired: boolean;
  status: 'not-started' | 'quarter-break' | 'live' | 'completed';
  winnerTeamId?: string;
}

export function createNetballMatch(
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  format: IndoorNetballFormatConfig = INDOOR_NETBALL_FORMAT
): NetballMatchState {
  return {
    matchId,
    fixtureId,
    format,
    homeTeamId,
    awayTeamId,
    homeScore: 0,
    awayScore: 0,
    currentQuarter: 1,
    quarterScores: [{ quarter: 1, homeGoals: 0, awayGoals: 0 }],
    goalHistory: [],
    timerSeconds: format.quarterDurationSeconds,
    timerRunning: false,
    timerExpired: false,
    status: 'not-started',
  };
}
