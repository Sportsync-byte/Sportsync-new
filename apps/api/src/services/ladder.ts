import type { CompetitionSettings, LadderEntry } from '@sportsync/shared';
import { calculateLadder, type MatchResult } from '@sportsync/shared';

export interface CompetitionDoc {
  teamIds: string[];
  settings: CompetitionSettings;
  ladder: LadderEntry[];
}

export interface FixtureResult {
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeWickets?: number | null;
  awayWickets?: number | null;
}

export function buildLadderFromFixtures(
  competition: CompetitionDoc,
  fixtures: FixtureResult[]
): LadderEntry[] {
  const results: MatchResult[] = fixtures
    .filter((f) => f.status === 'completed' && f.homeScore != null && f.awayScore != null)
    .map((f) => ({
      homeTeamId: f.homeTeamId,
      awayTeamId: f.awayTeamId,
      homeScore: f.homeScore!,
      awayScore: f.awayScore!,
      homeWickets: f.homeWickets ?? undefined,
      awayWickets: f.awayWickets ?? undefined,
    }));

  return calculateLadder(competition.teamIds, results, {
    win: competition.settings.pointsForWin,
    tie: competition.settings.pointsForTie,
    loss: competition.settings.pointsForLoss,
    bonusPointThreshold: competition.settings.bonusPointThreshold,
  });
}
