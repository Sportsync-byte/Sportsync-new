import { MatchStateModel } from '../models/match-state.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { CompetitionModel } from '../models/competition.js';
import { CourtModel } from '../models/court.js';
import { getScoreboardDisplay, getNetballScoreboard, getFootballScoreboard } from '@sportsync/sport-rules';
import type { IndoorCricketMatchState, NetballMatchState, LiveMatchSummary, SportId, IndoorFootballMatchState } from '@sportsync/shared';

function isLiveMatchStatus(sport: string, status: string): boolean {
  if (status === 'completed') return false;
  if (sport === 'indoor-netball') {
    return ['live', 'quarter-break', 'not-started'].includes(status);
  }
  if (sport === 'indoor-football') {
    return ['live', 'half-time', 'not-started'].includes(status);
  }
  return ['innings-1', 'innings-2', 'not-started'].includes(status);
}

export async function searchLiveMatches(query: {
  venueId?: string;
  competitionId?: string;
  courtId?: string;
  teamName?: string;
  liveOnly?: boolean;
}): Promise<LiveMatchSummary[]> {
  const matchFilter: Record<string, unknown> = {};
  if (query.venueId) matchFilter.venueId = query.venueId;

  const matches = await MatchStateModel.find(matchFilter);
  const summaries: LiveMatchSummary[] = [];

  for (const doc of matches) {
    const sport = (doc.sport || 'indoor-cricket') as SportId;
    const fixture = await FixtureModel.findOne({ id: doc.fixtureId });
    if (!fixture) continue;
    if (fixture.status === 'completed') continue;
    if (query.competitionId && fixture.competitionId !== query.competitionId) continue;
    if (query.courtId && fixture.courtId !== query.courtId) continue;

    const state = doc.state as IndoorCricketMatchState | NetballMatchState | IndoorFootballMatchState;
    if (query.liveOnly && !isLiveMatchStatus(sport, state.status)) continue;

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

    if (sport === 'indoor-netball') {
      const netballState = state as NetballMatchState;
      const display = getNetballScoreboard(netballState);
      summaries.push({
        matchId: doc.matchId,
        fixtureId: doc.fixtureId,
        venueId: doc.venueId,
        competitionId: fixture.competitionId,
        sport,
        competitionName: competition?.name,
        courtId: fixture.courtId ?? undefined,
        courtName: court?.name,
        homeTeamId: fixture.homeTeamId,
        homeTeamName: homeTeam?.name,
        awayTeamId: fixture.awayTeamId,
        awayTeamName: awayTeam?.name,
        homeScore: netballState.homeScore,
        awayScore: netballState.awayScore,
        status: netballState.status,
        quarter: display.quarter,
      });
      continue;
    }

    if (sport === 'indoor-football') {
      const footballState = state as IndoorFootballMatchState;
      const display = getFootballScoreboard(footballState);
      summaries.push({
        matchId: doc.matchId,
        fixtureId: doc.fixtureId,
        venueId: doc.venueId,
        competitionId: fixture.competitionId,
        sport,
        competitionName: competition?.name,
        courtId: fixture.courtId ?? undefined,
        courtName: court?.name,
        homeTeamId: fixture.homeTeamId,
        homeTeamName: homeTeam?.name,
        awayTeamId: fixture.awayTeamId,
        awayTeamName: awayTeam?.name,
        homeScore: footballState.homeScore,
        awayScore: footballState.awayScore,
        status: footballState.status,
        quarter: display.half,
      });
      continue;
    }

    const cricketState = state as IndoorCricketMatchState;
    const display = getScoreboardDisplay(cricketState);
    const homeInnings = cricketState.innings.find((i) => i.teamId === fixture.homeTeamId) ?? cricketState.innings[0];
    const awayInnings = cricketState.innings.find((i) => i.teamId === fixture.awayTeamId) ?? cricketState.innings[1];

    summaries.push({
      matchId: doc.matchId,
      fixtureId: doc.fixtureId,
      venueId: doc.venueId,
      competitionId: fixture.competitionId,
      sport,
      competitionName: competition?.name,
      courtId: fixture.courtId ?? undefined,
      courtName: court?.name,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: homeTeam?.name,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: awayTeam?.name,
      homeScore: homeInnings.totalRuns,
      awayScore: awayInnings.totalRuns,
      homeWickets: homeInnings.wickets,
      awayWickets: awayInnings.wickets,
      status: cricketState.status,
      over: display.current.over,
      ball: display.current.ball,
    });
  }

  return summaries.sort((a, b) => {
    const courtA = a.courtName || 'zzz';
    const courtB = b.courtName || 'zzz';
    return courtA.localeCompare(courtB);
  });
}

export async function checkCourtConflict(
  venueId: string,
  courtId: string,
  scheduledAt: string,
  excludeFixtureId?: string
): Promise<boolean> {
  const conflict = await FixtureModel.findOne({
    venueId,
    courtId,
    scheduledAt,
    status: { $in: ['scheduled', 'live'] },
    ...(excludeFixtureId ? { id: { $ne: excludeFixtureId } } : {}),
  });
  return Boolean(conflict);
}
