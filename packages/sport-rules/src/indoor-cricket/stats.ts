import type {
  BatterStats,
  BowlerStats,
  FieldingStats,
  IndoorCricketMatchState,
  BallEvent,
} from '@sportsync/shared';

export interface MatchPlayerStats {
  batters: BatterStats[];
  bowlers: BowlerStats[];
  fielders: FieldingStats[];
}

function isLegalDelivery(extra?: BallEvent['extra']): boolean {
  if (!extra) return true;
  return extra.type !== 'wide' && extra.type !== 'no-ball' && extra.type !== 'leg-side-wide';
}

export function aggregateMatchStats(state: IndoorCricketMatchState): MatchPlayerStats {
  const batterMap = new Map<string, BatterStats>();
  const bowlerMap = new Map<string, BowlerStats>();
  const fielderMap = new Map<string, FieldingStats>();

  const ensureBatter = (id: string): BatterStats => {
    if (!batterMap.has(id)) {
      batterMap.set(id, { playerId: id, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, ducks: 0, isOut: false });
    }
    return batterMap.get(id)!;
  };

  const ensureBowler = (id: string): BowlerStats => {
    if (!bowlerMap.has(id)) {
      bowlerMap.set(id, { playerId: id, overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 });
    }
    return bowlerMap.get(id)!;
  };

  const ensureFielder = (id: string): FieldingStats => {
    if (!fielderMap.has(id)) {
      fielderMap.set(id, { playerId: id, catches: 0, runOuts: 0, stumpings: 0 });
    }
    return fielderMap.get(id)!;
  };

  for (const innings of state.innings) {
    for (const ball of innings.ballHistory) {
      if (!ball.bowlerId) continue;

      const striker = ensureBatter(ball.strikerId);
      const bowler = ensureBowler(ball.bowlerId);

      let ballRuns = ball.runs;
      if (ball.extra) ballRuns += ball.extra.runs;

      if (!ball.extra || ball.extra.type === 'bye' || ball.extra.type === 'leg-bye') {
        striker.runs += ball.runs;
        if (ball.runs === 4) striker.fours += 1;
        if (ball.runs === 6) striker.sixes += 1;
      }

      if (isLegalDelivery(ball.extra)) {
        striker.ballsFaced += 1;
        bowler.balls += 1;
        if (bowler.balls >= 6) {
          bowler.overs += 1;
          bowler.balls = 0;
        }
      }

      bowler.runs += ballRuns;

      if (ball.dismissal) {
        const outBatter = ensureBatter(ball.dismissal.batterId);
        outBatter.isOut = true;
        outBatter.runs += -5;
        bowler.wickets += 1;

        if (ball.dismissal.fielderId) {
          const fielder = ensureFielder(ball.dismissal.fielderId);
          if (ball.dismissal.type === 'caught') fielder.catches += 1;
          if (ball.dismissal.type === 'run-out') fielder.runOuts += 1;
          if (ball.dismissal.type === 'stumped') fielder.stumpings += 1;
        }
      }
    }
  }

  for (const b of batterMap.values()) {
    if (b.isOut && b.runs === 0) b.ducks += 1;
  }

  return {
    batters: Array.from(batterMap.values()),
    bowlers: Array.from(bowlerMap.values()),
    fielders: Array.from(fielderMap.values()),
  };
}

export interface PlayerSeasonStats {
  playerId: string;
  matchesPlayed: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  ducks: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
}

export function mergeSeasonStats(
  existing: PlayerSeasonStats | null,
  match: MatchPlayerStats,
  playerId: string
): PlayerSeasonStats {
  const batting = match.batters.find((b) => b.playerId === playerId);
  const bowling = match.bowlers.find((b) => b.playerId === playerId);
  const fielding = match.fielders.find((f) => f.playerId === playerId);

  const base: PlayerSeasonStats = existing ?? {
    playerId,
    matchesPlayed: 0,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    ducks: 0,
    wickets: 0,
    overs: 0,
    runsConceded: 0,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
  };

  const played = batting || bowling || fielding;
  return {
    playerId,
    matchesPlayed: base.matchesPlayed + (played ? 1 : 0),
    runs: base.runs + (batting?.runs ?? 0),
    ballsFaced: base.ballsFaced + (batting?.ballsFaced ?? 0),
    fours: base.fours + (batting?.fours ?? 0),
    sixes: base.sixes + (batting?.sixes ?? 0),
    ducks: base.ducks + (batting?.ducks ?? 0),
    wickets: base.wickets + (bowling?.wickets ?? 0),
    overs: base.overs + (bowling?.overs ?? 0),
    runsConceded: base.runsConceded + (bowling?.runs ?? 0),
    catches: base.catches + (fielding?.catches ?? 0),
    runOuts: base.runOuts + (fielding?.runOuts ?? 0),
    stumpings: base.stumpings + (fielding?.stumpings ?? 0),
  };
}
