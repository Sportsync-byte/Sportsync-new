import { Router } from 'express';
import { generateRoundRobinFixtures } from '@sportsync/shared';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';
import { buildLadderFromFixtures } from '../services/ladder.js';
import { checkCanAddCompetition, checkCanUseSport } from '../services/subscription.js';
import { newId } from '../utils/id.js';

export const competitionsRouter = Router();

competitionsRouter.get('/venue/:venueId', async (req, res) => {
  const competitions = await CompetitionModel.find({ venueId: req.params.venueId }).sort({
    createdAt: -1,
  });
  res.json(competitions);
});

competitionsRouter.get('/:competitionId', async (req, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json(competition);
});

competitionsRouter.post('/', async (req, res) => {
  const { venueId, name, season, sport, teamIds, settings, status } = req.body;
  if (!venueId || !name) {
    res.status(400).json({ error: 'venueId and name are required' });
    return;
  }

  const sportId = sport || 'indoor-cricket';
  const compCheck = await checkCanAddCompetition(venueId);
  if (!compCheck.ok) {
    res.status(403).json({ error: compCheck.error });
    return;
  }

  const sportCheck = await checkCanUseSport(venueId, sportId);
  if (!sportCheck.ok) {
    res.status(403).json({ error: sportCheck.error });
    return;
  }

  const competition = await CompetitionModel.create({
    id: newId(),
    venueId,
    name,
    season: season || new Date().getFullYear().toString(),
    sport: sportId,
    teamIds: teamIds || [],
    settings: settings || {},
    status: status || 'draft',
    ladder: [],
  });
  res.status(201).json(competition);
});

competitionsRouter.patch('/:competitionId', async (req, res) => {
  const competition = await CompetitionModel.findOneAndUpdate(
    { id: req.params.competitionId },
    { $set: req.body },
    { new: true }
  );
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json(competition);
});

competitionsRouter.post('/:competitionId/teams', async (req, res) => {
  const { teamIds } = req.body;
  const competition = await CompetitionModel.findOneAndUpdate(
    { id: req.params.competitionId },
    { $addToSet: { teamIds: { $each: teamIds } } },
    { new: true }
  );
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json(competition);
});

competitionsRouter.post('/:competitionId/generate-fixtures', async (req, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  if (competition.teamIds.length < 2) {
    res.status(400).json({ error: 'At least 2 teams required' });
    return;
  }

  await FixtureModel.deleteMany({
    competitionId: competition.id,
    status: 'scheduled',
  });

  const generated = generateRoundRobinFixtures(
    competition.teamIds,
    competition.id,
    'default',
    {
      doubleRoundRobin: competition.settings.doubleRoundRobin,
      startDate: req.body.startDate,
      daysBetweenRounds: req.body.daysBetweenRounds,
    }
  );

  const fixtures = await FixtureModel.insertMany(
    generated.map((f) => ({
      ...f,
      id: newId(),
      venueId: competition.venueId,
    }))
  );

  if (competition.status === 'draft') {
    competition.status = 'active';
    await competition.save();
  }

  res.status(201).json(fixtures);
});

competitionsRouter.get('/:competitionId/ladder', async (req, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  const fixtures = await FixtureModel.find({ competitionId: competition.id });
  const ladder = buildLadderFromFixtures(competition, fixtures);

  await CompetitionModel.updateOne({ id: competition.id }, { ladder });

  res.json(ladder);
});

competitionsRouter.get('/:competitionId/fixtures', async (req, res) => {
  const fixtures = await FixtureModel.find({ competitionId: req.params.competitionId }).sort({
    round: 1,
    scheduledAt: 1,
  });
  res.json(fixtures);
});
