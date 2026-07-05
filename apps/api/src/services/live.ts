import { MatchStateModel } from '../models/match-state.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { CompetitionModel } from '../models/competition.js';
import { CourtModel } from '../models/court.js';
import { getScoreboardDisplay } from '@sportsync/sport-rules';
import type { IndoorCricketMatchState, LiveMatchSummary } from '@sportsync/shared';

export async function searchLiveMatches(query: {
  venueId?: string;
  competitionId?: string;
  courtId?: string;
  teamName?: string;
  liveOnly?: boolean;
}): Promise<LiveMatchSummary[]> {
  const matchFilter: Record<string, unknown> = {};
  if (query.venueId) matchFilter.venueId = query.venueId;
  if (query.liveOnly) {
    matchFilter['state.status'] = { $in: ['innings-1', 'innings-2', 'not-started'] };
  }

  const matches = await MatchStateModel.find(matchFilter);
  const summaries: LiveMatchSummary[] = [];

  for (const doc of matches) {
    const state = doc.state as IndoorCricketMatchState;
    const fixture = await FixtureModel.findOne({ id: doc.fixtureId });
    if (!fixture) continue;
    if (query.competitionId && fixture.competitionId !== query.competitionId) continue;
    if (query.courtId && fixture.courtId !== query.courtId) continue;

    const [homeTeam, awayTeam, competition, court] = await Promise.all([
      TeamModel.findOne({ id: fixture.homeTeamId }),
      TeamModel.findOne({ id: fixture.awayTeamId }),
      CompetitionModel.findOne({ id: fixture.competitionId }),
      fixture.courtId ? CourtModel.findOne({ id: fixture.courtId }) : null,
    ]);

    if (query.teamName) {
      const search = query.teamName.toLowerCase();
      const homeMatch = homeTeam?.name.toLowerCase().includes(search);
      const awayMatch = awayTeam?.name.toLowerCase().includes(search);
      if (!homeMatch && !awayMatch) continue;
    }

    const display = getScoreboardDisplay(state);

    summaries.push({
      matchId: doc.matchId,
      fixtureId: doc.fixtureId,
      venueId: doc.venueId,
      competitionId: fixture.competitionId,
      competitionName: competition?.name,
      courtName: court?.name,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: homeTeam?.name,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: awayTeam?.name,
      homeScore: state.innings[0].totalRuns,
      awayScore: state.innings[1].totalRuns,
      homeWickets: state.innings[0].wickets,
      awayWickets: state.innings[1].wickets,
      status: state.status,
      over: display.current.over,
      ball: display.current.ball,
    });
  }

  return summaries;
}
