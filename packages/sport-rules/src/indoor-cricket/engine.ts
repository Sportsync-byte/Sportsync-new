import type {
  BallEvent,
  IndoorCricketMatchState,
  InningsState,
  RunValue,
  ExtraType,
  DismissalType,
} from '@sportsync/shared';
import {
  DISMISSAL_PENALTY,
  createEmptyInnings,
} from '@sportsync/shared';

export interface RecordBallInput {
  runs: RunValue;
  extra?: { type: ExtraType; runs: number };
  dismissal?: {
    type: DismissalType;
    batterId: string;
    fielderId?: string;
  };
  /** Force strike rotation (manual override) */
  forceStrikeRotation?: boolean;
}

function generateBallId(): string {
  return `ball_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentInnings(state: IndoorCricketMatchState): InningsState {
  return state.innings[state.battingTeamIndex];
}

function isLegalDelivery(extra?: RecordBallInput['extra']): boolean {
  if (!extra) return true;
  return extra.type !== 'wide' && extra.type !== 'no-ball' && extra.type !== 'leg-side-wide';
}

function shouldRotateStrike(
  runs: RunValue,
  extra: RecordBallInput['extra'],
  forceRotation?: boolean
): boolean {
  if (forceRotation) return true;
  if (extra && !isLegalDelivery(extra)) return false;
  return runs % 2 === 1;
}

function advanceOver(innings: InningsState): void {
  innings.ballsInOver += 1;
  if (innings.ballsInOver >= 6) {
    innings.ballsInOver = 0;
    innings.currentOver += 1;
  }
}

function swapStrikers(innings: InningsState): void {
  const temp = innings.strikerId;
  innings.strikerId = innings.nonStrikerId;
  innings.nonStrikerId = temp;
}

function calculateBallRuns(input: RecordBallInput): number {
  let total = input.runs;
  if (input.extra) {
    total += input.extra.runs;
  }
  return total;
}

export function recordBall(
  state: IndoorCricketMatchState,
  input: RecordBallInput
): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  const ballRuns = calculateBallRuns(input);

  const strikeRotated = shouldRotateStrike(
    input.runs,
    input.extra,
    input.forceStrikeRotation
  );

  const ball: BallEvent = {
    id: generateBallId(),
    timestamp: new Date().toISOString(),
    over: innings.currentOver,
    ballInOver: innings.ballsInOver,
    partnership: innings.currentPartnership,
    strikerId: innings.strikerId,
    nonStrikerId: innings.nonStrikerId,
    bowlerId: innings.bowlerId,
    runs: input.runs,
    extra: input.extra,
    dismissal: input.dismissal
      ? { ...input.dismissal, penaltyApplied: true }
      : undefined,
    strikeRotated,
  };

  innings.totalRuns += ballRuns;
  innings.ballHistory.push(ball);

  if (input.dismissal) {
    innings.wickets += 1;
    innings.totalRuns += DISMISSAL_PENALTY.teamRuns;
  }

  if (isLegalDelivery(input.extra)) {
    advanceOver(innings);
  }

  if (strikeRotated) {
    swapStrikers(innings);
  }

  return newState;
}

export function undoLastBall(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);

  const lastBall = innings.ballHistory.pop();
  if (!lastBall) return state;

  const ballRuns = calculateBallRuns({
    runs: lastBall.runs,
    extra: lastBall.extra,
  });
  innings.totalRuns -= ballRuns;

  if (lastBall.dismissal) {
    innings.wickets -= 1;
    innings.totalRuns -= DISMISSAL_PENALTY.teamRuns;
  }

  if (isLegalDelivery(lastBall.extra)) {
    if (innings.ballsInOver === 0) {
      innings.currentOver = Math.max(0, innings.currentOver - 1);
      innings.ballsInOver = 5;
    } else {
      innings.ballsInOver -= 1;
    }
  }

  if (lastBall.strikeRotated) {
    swapStrikers(innings);
  }

  return newState;
}

export function createMatch(
  matchId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  format: IndoorCricketMatchState['format']
): IndoorCricketMatchState {
  return {
    matchId,
    fixtureId,
    format,
    innings: [createEmptyInnings(homeTeamId), createEmptyInnings(awayTeamId)],
    battingTeamIndex: 0,
    status: 'not-started',
  };
}

export function getScoreboardDisplay(state: IndoorCricketMatchState) {
  const batting = getCurrentInnings(state);
  const bowling = state.innings[state.battingTeamIndex === 0 ? 1 : 0];

  return {
    battingTeam: {
      teamId: batting.teamId,
      partnerships: batting.partnerships,
      total: batting.totalRuns,
      wickets: batting.wickets,
    },
    bowlingTeam: {
      teamId: bowling.teamId,
      partnerships: bowling.partnerships,
      total: bowling.totalRuns,
      wickets: bowling.wickets,
    },
    current: {
      strikerId: batting.strikerId,
      nonStrikerId: batting.nonStrikerId,
      bowlerId: batting.bowlerId,
      partnership: batting.currentPartnership,
      over: batting.currentOver,
      ball: batting.ballsInOver,
      timerSeconds: batting.timerSeconds,
      timerRunning: batting.timerRunning,
    },
  };
}
