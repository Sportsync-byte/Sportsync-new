import type { IndoorCricketMatchState, NetballMatchState, IndoorFootballMatchState, BasketballMatchState } from '@sportsync/shared';
import {
  eventsFromNetballState,
  eventsFromFootballState,
  eventsFromBasketballState,
} from '@sportsync/sport-rules';
import { getMatchResult } from '@sportsync/sport-rules';
import { FixtureModel } from '../models/fixture.js';
import { CompetitionModel } from '../models/competition.js';
import { MatchStateModel } from '../models/match-state.js';
import { buildLadderFromFixtures } from './ladder.js';
import { persistMatchStats } from './stats.js';
import { persistGoalSportStats } from './goal-sport-stats.js';

export async function completeFixtureFromMatchState(
  matchId: string,
  sport: string,
  state: unknown
): Promise<ReturnType<typeof FixtureModel.findOne>> {
  const fixture = await FixtureModel.findOne({ matchId });
  if (!fixture || fixture.status === 'completed') return fixture;

  if (sport === 'indoor-cricket') {
    const cricketState = state as IndoorCricketMatchState;
    const result = getMatchResult(cricketState);
    fixture.status = 'completed';
    fixture.homeScore = result.homeScore;
    fixture.awayScore = result.awayScore;
    fixture.homeWickets = result.homeWickets;
    fixture.awayWickets = result.awayWickets;
    fixture.winnerTeamId = result.winnerTeamId ?? undefined;
    await fixture.save();

    const competition = await CompetitionModel.findOne({ id: fixture.competitionId });
    if (competition) {
      const fixtures = await FixtureModel.find({ competitionId: competition.id });
      const ladder = buildLadderFromFixtures(competition, fixtures);
      await CompetitionModel.updateOne({ id: competition.id }, { ladder });
      await persistMatchStats(cricketState, fixture.venueId, fixture.competitionId);
    }
    return fixture;
  }

  if (sport === 'indoor-netball') {
    const netballState = state as NetballMatchState;
    fixture.status = 'completed';
    fixture.homeScore = netballState.homeScore;
    fixture.awayScore = netballState.awayScore;
    fixture.winnerTeamId = netballState.winnerTeamId;
    await fixture.save();

    const competition = await CompetitionModel.findOne({ id: fixture.competitionId });
    if (competition) {
      const fixtures = await FixtureModel.find({ competitionId: competition.id });
      const ladder = buildLadderFromFixtures(competition, fixtures);
      await CompetitionModel.updateOne({ id: competition.id }, { ladder });
      await persistGoalSportStats(
        eventsFromNetballState(netballState),
        fixture.venueId,
        fixture.competitionId
      );
    }
    return fixture;
  }

  if (sport === 'indoor-football') {
    const footballState = state as IndoorFootballMatchState;
    fixture.status = 'completed';
    fixture.homeScore = footballState.homeScore;
    fixture.awayScore = footballState.awayScore;
    fixture.winnerTeamId = footballState.winnerTeamId;
    await fixture.save();

    const competition = await CompetitionModel.findOne({ id: fixture.competitionId });
    if (competition) {
      const fixtures = await FixtureModel.find({ competitionId: competition.id });
      const ladder = buildLadderFromFixtures(competition, fixtures);
      await CompetitionModel.updateOne({ id: competition.id }, { ladder });
      await persistGoalSportStats(
        eventsFromFootballState(footballState),
        fixture.venueId,
        fixture.competitionId
      );
    }
    return fixture;
  }

  if (sport === 'basketball') {
    const basketballState = state as BasketballMatchState;
    fixture.status = 'completed';
    fixture.homeScore = basketballState.homeScore;
    fixture.awayScore = basketballState.awayScore;
    fixture.winnerTeamId = basketballState.winnerTeamId;
    await fixture.save();

    const competition = await CompetitionModel.findOne({ id: fixture.competitionId });
    if (competition) {
      const fixtures = await FixtureModel.find({ competitionId: competition.id });
      const ladder = buildLadderFromFixtures(competition, fixtures);
      await CompetitionModel.updateOne({ id: competition.id }, { ladder });
      await persistGoalSportStats(
        eventsFromBasketballState(basketballState),
        fixture.venueId,
        fixture.competitionId
      );
    }
    return fixture;
  }

  return fixture;
}

export async function getMatchDoc(matchId: string) {
  return MatchStateModel.findOne({ matchId });
}
