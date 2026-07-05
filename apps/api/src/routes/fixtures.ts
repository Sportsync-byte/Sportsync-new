import { Router } from 'express';
import { INDOOR_CRICKET_FORMATS, createNetballMatch, INDOOR_NETBALL_FORMAT, createFootballMatch, INDOOR_FOOTBALL_FORMAT } from '@sportsync/shared';
import { createMatch } from '@sportsync/sport-rules';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';
import { MatchStateModel } from '../models/match-state.js';
import { checkCourtConflict } from '../services/live.js';
import { newId } from '../utils/id.js';

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
  const existing = await FixtureModel.findOne({ id: req.params.fixtureId });
  if (!existing) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }

  const courtId = req.body.courtId ?? existing.courtId;
  const scheduledAt = req.body.scheduledAt ?? existing.scheduledAt;

  if (courtId && scheduledAt) {
    const conflict = await checkCourtConflict(
      existing.venueId,
      courtId,
      scheduledAt,
      existing.id
    );
    if (conflict) {
      res.status(409).json({ error: 'Another fixture is already scheduled on this court at that time' });
      return;
    }
  }

  const fixture = await FixtureModel.findOneAndUpdate(
    { id: req.params.fixtureId },
    { $set: req.body },
    { new: true }
  );
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

  const matchId = newId();
  let sport = competition.sport;
  let state: unknown;

  if (sport === 'indoor-netball') {
    state = createNetballMatch(matchId, fixture.id, fixture.homeTeamId, fixture.awayTeamId, INDOOR_NETBALL_FORMAT);
  } else if (sport === 'indoor-football') {
    state = createFootballMatch(matchId, fixture.id, fixture.homeTeamId, fixture.awayTeamId, INDOOR_FOOTBALL_FORMAT);
  } else {
    sport = 'indoor-cricket';
    const formatKey = competition.settings.formatKey || 'six-aside';
    const format = INDOOR_CRICKET_FORMATS[formatKey];
    state = createMatch(matchId, fixture.id, fixture.homeTeamId, fixture.awayTeamId, format);
  }

  const match = await MatchStateModel.create({
    matchId,
    fixtureId: fixture.id,
    venueId: fixture.venueId,
    sport,
    state,
  });

  fixture.status = 'live';
  fixture.matchId = matchId;
  await fixture.save();

  res.status(201).json({ fixture, match });
});

// Re-export for backwards compatibility
export { completeFixtureFromMatchState as completeFixtureFromMatch } from '../services/match-completion.js';
