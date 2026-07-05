import { Router } from 'express';
import { INDOOR_CRICKET_FORMATS } from '@sportsync/shared';
import { createMatch } from '@sportsync/sport-rules';
import { MatchStateModel } from '../models/match-state.js';

export const matchesRouter = Router();

matchesRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'matches' });
});

matchesRouter.get('/formats/indoor-cricket', (_req, res) => {
  res.json(INDOOR_CRICKET_FORMATS);
});

matchesRouter.post('/indoor-cricket', async (req, res) => {
  try {
    const { matchId, fixtureId, venueId, homeTeamId, awayTeamId, formatKey } = req.body;

    if (!matchId || !fixtureId || !venueId || !homeTeamId || !awayTeamId || !formatKey) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const format = INDOOR_CRICKET_FORMATS[formatKey as keyof typeof INDOOR_CRICKET_FORMATS];
    if (!format) {
      res.status(400).json({ error: 'Invalid format' });
      return;
    }

    const state = createMatch(matchId, fixtureId, homeTeamId, awayTeamId, format);

    const doc = await MatchStateModel.create({
      matchId,
      fixtureId,
      venueId,
      sport: 'indoor-cricket',
      state,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

matchesRouter.get('/:matchId', async (req, res) => {
  try {
    const doc = await MatchStateModel.findOne({ matchId: req.params.matchId });
    if (!doc) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

matchesRouter.get('/venue/:venueId/live', async (req, res) => {
  try {
    const docs = await MatchStateModel.find({
      venueId: req.params.venueId,
      'state.status': { $in: ['innings-1', 'innings-2'] },
    }).select('matchId fixtureId state.status state.innings.teamId state.innings.totalRuns state.innings.wickets');

    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});
