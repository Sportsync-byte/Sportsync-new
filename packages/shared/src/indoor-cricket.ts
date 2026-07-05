export type IndoorCricketFormat = 'six-aside' | 'eight-aside' | 'asia-cup' | 'custom';

export interface IndoorCricketFormatConfig {
  format: IndoorCricketFormat;
  playersPerSide: number;
  totalOvers: number;
  partnerships: number;
  oversPerPartnership: number;
  /** Final partnership uses special batter/bowler selection rules */
  finalPartnershipSpecialRules?: boolean;
}

export const INDOOR_CRICKET_FORMATS: Record<
  Exclude<IndoorCricketFormat, 'custom'>,
  IndoorCricketFormatConfig
> = {
  'six-aside': {
    format: 'six-aside',
    playersPerSide: 6,
    totalOvers: 12,
    partnerships: 3,
    oversPerPartnership: 4,
  },
  'eight-aside': {
    format: 'eight-aside',
    playersPerSide: 8,
    totalOvers: 16,
    partnerships: 4,
    oversPerPartnership: 4,
  },
  'asia-cup': {
    format: 'asia-cup',
    playersPerSide: 6,
    totalOvers: 8,
    partnerships: 4,
    oversPerPartnership: 2,
    finalPartnershipSpecialRules: true,
  },
};

export type RunValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ExtraType =
  | 'wide'
  | 'no-ball'
  | 'leg-side-wide'
  | 'bye'
  | 'leg-bye';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'run-out'
  | 'stumped'
  | 'hit-wicket'
  | 'obstructing-field'
  | 'other';

export interface BallEvent {
  id: string;
  timestamp: string;
  over: number;
  ballInOver: number;
  partnership: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: RunValue;
  extra?: {
    type: ExtraType;
    runs: number;
  };
  dismissal?: {
    type: DismissalType;
    batterId: string;
    fielderId?: string;
    /** Indoor cricket: -5 team runs, -5 batter runs */
    penaltyApplied: boolean;
  };
  strikeRotated: boolean;
}

export interface PartnershipScore {
  partnership: number;
  runs: number;
  wickets: number;
  batterIds: [string, string];
}

export interface InningsState {
  teamId: string;
  totalRuns: number;
  wickets: number;
  currentPartnership: number;
  partnerships: PartnershipScore[];
  currentOver: number;
  ballsInOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  timerSeconds: number;
  timerRunning: boolean;
  ballHistory: BallEvent[];
}

export interface IndoorCricketMatchState {
  matchId: string;
  fixtureId: string;
  format: IndoorCricketFormatConfig;
  innings: [InningsState, InningsState];
  battingTeamIndex: 0 | 1;
  status: 'not-started' | 'innings-1' | 'innings-2' | 'completed';
  winnerTeamId?: string;
}

export const DISMISSAL_PENALTY = {
  teamRuns: -5,
  batterRuns: -5,
} as const;

export interface BatterStats {
  playerId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  ducks: number;
  isOut: boolean;
}

export interface BowlerStats {
  playerId: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
}

export interface FieldingStats {
  playerId: string;
  catches: number;
  runOuts: number;
  stumpings: number;
}

export function createEmptyInnings(teamId: string): InningsState {
  return {
    teamId,
    totalRuns: 0,
    wickets: 0,
    currentPartnership: 1,
    partnerships: [],
    currentOver: 0,
    ballsInOver: 0,
    strikerId: '',
    nonStrikerId: '',
    bowlerId: '',
    timerSeconds: 0,
    timerRunning: false,
    ballHistory: [],
  };
}
