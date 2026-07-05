import { Router } from 'express';
import { searchLiveMatches } from '../services/live.js';

export const liveRouter = Router();

liveRouter.get('/search', async (req, res) => {
  try {
    const summaries = await searchLiveMatches({
      venueId: req.query.venueId as string | undefined,
      competitionId: req.query.competitionId as string | undefined,
      courtId: req.query.courtId as string | undefined,
      teamName: req.query.teamName as string | undefined,
      liveOnly: req.query.status === 'live',
    });
    res.json(summaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search live matches' });
  }
});

liveRouter.get('/venue/:venueId', async (req, res) => {
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
