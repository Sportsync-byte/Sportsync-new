import type {
  BallEvent,
  IndoorCricketMatchState,
  InningsState,
  RunValue,
  ExtraType,
  DismissalType,
  PartnershipScore,
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
  forceStrikeRotation?: boolean;
}

export interface MatchResult {
  winnerTeamId: string | null;
  homeScore: number;
  awayScore: number;
  homeWickets: number;
  awayWickets: number;
  tied: boolean;
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
  if (input.extra) total += input.extra.runs;
  return total;
}

function getPartnershipOversCompleted(innings: InningsState, format: IndoorCricketMatchState['format']): number {
  const partnershipStartOver = (innings.currentPartnership - 1) * format.oversPerPartnership;
  return innings.currentOver - partnershipStartOver;
}

function isPartnershipComplete(innings: InningsState, format: IndoorCricketMatchState['format']): boolean {
  return getPartnershipOversCompleted(innings, format) >= format.oversPerPartnership;
}

function isInningsOversComplete(innings: InningsState, format: IndoorCricketMatchState['format']): boolean {
  return innings.currentOver >= format.totalOvers;
}

function finalizePartnership(innings: InningsState): void {
  const existing = innings.partnerships.find((p) => p.partnership === innings.currentPartnership);
  const score: PartnershipScore = {
    partnership: innings.currentPartnership,
    runs: innings.totalRuns - innings.partnerships.reduce((sum, p) => sum + p.runs, 0),
    wickets: innings.wickets - innings.partnerships.reduce((sum, p) => sum + p.wickets, 0),
    batterIds: [innings.strikerId, innings.nonStrikerId],
  };

  if (existing) {
    Object.assign(existing, score);
  } else {
    innings.partnerships.push(score);
  }
}

function checkPrompts(state: IndoorCricketMatchState): IndoorCricketMatchState['pendingPrompt'] {
  const innings = getCurrentInnings(state);

  if (!innings.strikerId || !innings.nonStrikerId) return 'batters';
  if (!innings.bowlerId) return 'bowler';
  if (isPartnershipComplete(innings, state.format) && innings.currentPartnership < state.format.partnerships) {
    return 'partnership';
  }
  return null;
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
    dismissedBatters: [],
    pendingPrompt: 'batters',
  };
}

export function startInnings(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  newState.status = newState.battingTeamIndex === 0 ? 'innings-1' : 'innings-2';
  newState.dismissedBatters = [];
  newState.pendingPrompt = 'batters';
  return newState;
}

export function setBatters(
  state: IndoorCricketMatchState,
  strikerId: string,
  nonStrikerId: string
): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  innings.strikerId = strikerId;
  innings.nonStrikerId = nonStrikerId;
  newState.pendingPrompt = innings.bowlerId ? checkPrompts(newState) : 'bowler';
  return newState;
}

export function setBowler(state: IndoorCricketMatchState, bowlerId: string): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  innings.bowlerId = bowlerId;
  if (newState.status === 'not-started') {
    newState.status = 'innings-1';
    innings.timerSeconds = newState.format.inningsDurationSeconds;
    innings.timerExpired = false;
  }
  newState.pendingPrompt = checkPrompts(newState);
  return newState;
}

export function startNextPartnership(
  state: IndoorCricketMatchState,
  strikerId: string,
  nonStrikerId: string
): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  finalizePartnership(innings);
  innings.currentPartnership += 1;
  innings.strikerId = strikerId;
  innings.nonStrikerId = nonStrikerId;
  newState.pendingPrompt = 'bowler';
  return newState;
}

export function recordBall(
  state: IndoorCricketMatchState,
  input: RecordBallInput
): IndoorCricketMatchState {
  let newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  const ballRuns = calculateBallRuns(input);

  const strikeRotated = shouldRotateStrike(input.runs, input.extra, input.forceStrikeRotation);

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
    dismissal: input.dismissal ? { ...input.dismissal, penaltyApplied: true } : undefined,
    strikeRotated,
  };

  innings.totalRuns += ballRuns;
  innings.ballHistory.push(ball);

  if (input.dismissal) {
    innings.wickets += 1;
    innings.totalRuns += DISMISSAL_PENALTY.teamRuns;
    if (!newState.dismissedBatters.includes(input.dismissal.batterId)) {
      newState.dismissedBatters.push(input.dismissal.batterId);
    }
  }

  if (isLegalDelivery(input.extra)) {
    advanceOver(innings);
  }

  if (strikeRotated) {
    swapStrikers(innings);
  }

  if (isInningsOversComplete(innings, newState.format)) {
    newState = endInnings(newState);
  } else if (isPartnershipComplete(innings, newState.format)) {
    if (innings.currentPartnership < newState.format.partnerships) {
      newState.pendingPrompt = 'partnership';
    }
  } else {
    newState.pendingPrompt = checkPrompts(newState);
  }

  return newState;
}

export function undoLastBall(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);

  const lastBall = innings.ballHistory.pop();
  if (!lastBall) return state;

  const ballRuns = calculateBallRuns({ runs: lastBall.runs, extra: lastBall.extra });
  innings.totalRuns -= ballRuns;

  if (lastBall.dismissal) {
    innings.wickets -= 1;
    innings.totalRuns -= DISMISSAL_PENALTY.teamRuns;
    const idx = newState.dismissedBatters.indexOf(lastBall.dismissal.batterId);
    if (idx >= 0) newState.dismissedBatters.splice(idx, 1);
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

  newState.pendingPrompt = checkPrompts(newState);
  return newState;
}

export function endInnings(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  finalizePartnership(innings);

  if (newState.battingTeamIndex === 0) {
    newState.battingTeamIndex = 1;
    newState.status = 'innings-2';
    newState.dismissedBatters = [];
    const nextInnings = getCurrentInnings(newState);
    nextInnings.currentPartnership = 1;
    nextInnings.currentOver = 0;
    nextInnings.ballsInOver = 0;
    nextInnings.timerSeconds = newState.format.inningsDurationSeconds;
    nextInnings.timerRunning = false;
    nextInnings.timerExpired = false;
    newState.pendingPrompt = 'batters';
  } else {
    newState.status = 'completed';
    const home = newState.innings[0];
    const away = newState.innings[1];
    if (home.totalRuns > away.totalRuns) {
      newState.winnerTeamId = home.teamId;
    } else if (away.totalRuns > home.totalRuns) {
      newState.winnerTeamId = away.teamId;
    } else {
      newState.winnerTeamId = undefined;
    }
    newState.pendingPrompt = null;
  }

  return newState;
}

export function getMatchResult(state: IndoorCricketMatchState): MatchResult {
  const home = state.innings[0];
  const away = state.innings[1];
  return {
    winnerTeamId: state.winnerTeamId ?? null,
    homeScore: home.totalRuns,
    awayScore: away.totalRuns,
    homeWickets: home.wickets,
    awayWickets: away.wickets,
    tied: state.status === 'completed' && !state.winnerTeamId,
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
      timerExpired: batting.timerExpired,
    },
    status: state.status,
    pendingPrompt: state.pendingPrompt,
    winnerTeamId: state.winnerTeamId,
  };
}

export function resetInningsTimer(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  innings.timerSeconds = newState.format.inningsDurationSeconds;
  innings.timerRunning = false;
  innings.timerExpired = false;
  return newState;
}

export function tickTimer(state: IndoorCricketMatchState): IndoorCricketMatchState {
  const newState = structuredClone(state);
  const innings = getCurrentInnings(newState);
  if (!innings.timerRunning || innings.timerExpired) return state;

  innings.timerSeconds = Math.max(0, innings.timerSeconds - 1);
  if (innings.timerSeconds === 0) {
    innings.timerRunning = false;
    innings.timerExpired = true;
  }
  return newState;
}
