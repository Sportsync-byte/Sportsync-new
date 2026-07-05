import { Router } from 'express';
import { INDOOR_CRICKET_FORMATS } from '@sportsync/shared';
import type { SportId } from '@sportsync/shared';
import { getScoreboardForMatch } from '@sportsync/sport-rules';
import { MatchStateModel } from '../models/match-state.js';
import { searchLiveMatches } from '../services/live.js';

export const matchesRouter = Router();

matchesRouter.get('/formats/indoor-cricket', (_req, res) => {
  res.json(INDOOR_CRICKET_FORMATS);
});

matchesRouter.get('/:matchId', async (req, res) => {
  try {
    const doc = await MatchStateModel.findOne({ matchId: req.params.matchId });
    if (!doc) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    const scoreboard = getScoreboardForMatch((doc.sport || 'indoor-cricket') as SportId, doc.state);
    res.json({ ...doc.toObject(), scoreboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

matchesRouter.get('/venue/:venueId/live', async (req, res) => {
  try {
    const summaries = await searchLiveMatches({
      venueId: req.params.venueId,
      liveOnly: true,
    });
    res.json(summaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});
