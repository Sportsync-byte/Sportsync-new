import { Router } from 'express';
import { INDOOR_CRICKET_FORMATS } from '@sportsync/shared';
import { createMatch } from '@sportsync/sport-rules';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';
import { MatchStateModel } from '../models/match-state.js';
import { buildLadderFromFixtures } from '../services/ladder.js';
import { persistMatchStats } from '../services/stats.js';
import { newId } from '../utils/id.js';
import { getMatchResult } from '@sportsync/sport-rules';
import type { IndoorCricketMatchState } from '@sportsync/shared';

export const fixturesRouter = Router();

fixturesRouter.get('/venue/:venueId', async (req, res) => {
  const filter: Record<string, unknown> = { venueId: req.params.venueId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.competitionId) filter.competitionId = req.query.competitionId;

  const fixtures = await FixtureModel.find(filter).sort({ scheduledAt: 1, round: 1 });
  res.json(fixtures);
});

fixturesRouter.get('/:fixtureId', async (req, res) => {
  const fixture = await FixtureModel.findOne({ id: req.params.fixtureId });
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }
  res.json(fixture);
});

fixturesRouter.patch('/:fixtureId', async (req, res) => {
  const fixture = await FixtureModel.findOneAndUpdate(
    { id: req.params.fixtureId },
    { $set: req.body },
    { new: true }
  );
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }
  res.json(fixture);
});

fixturesRouter.post('/:fixtureId/start', async (req, res) => {
  const fixture = await FixtureModel.findOne({ id: req.params.fixtureId });
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }

  if (fixture.status === 'live' && fixture.matchId) {
    const existing = await MatchStateModel.findOne({ matchId: fixture.matchId });
    res.json({ fixture, match: existing });
    return;
  }

  const competition = await CompetitionModel.findOne({ id: fixture.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  const formatKey = competition.settings.formatKey || 'six-aside';
  const format = INDOOR_CRICKET_FORMATS[formatKey];
  const matchId = newId();

  const state = createMatch(
    matchId,
    fixture.id,
    fixture.homeTeamId,
    fixture.awayTeamId,
    format
  );

  const match = await MatchStateModel.create({
    matchId,
    fixtureId: fixture.id,
    venueId: fixture.venueId,
    sport: 'indoor-cricket',
    state,
  });

  fixture.status = 'live';
  fixture.matchId = matchId;
  await fixture.save();

  res.status(201).json({ fixture, match });
});

export async function completeFixtureFromMatch(matchId: string, state: IndoorCricketMatchState) {
  const fixture = await FixtureModel.findOne({ matchId });
  if (!fixture || fixture.status === 'completed') return null;

  const result = getMatchResult(state);
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
    await persistMatchStats(state, fixture.venueId, fixture.competitionId);
  }

  return fixture;
}
