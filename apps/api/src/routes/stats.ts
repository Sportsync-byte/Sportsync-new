import { Router } from 'express';
import { PlayerStatsModel } from '../models/player-stats.js';

export const statsRouter = Router();

statsRouter.get('/player/:playerId', async (req, res) => {
  const filter: Record<string, string> = { playerId: req.params.playerId };
  if (req.query.competitionId) filter.competitionId = req.query.competitionId as string;
  if (req.query.venueId) filter.venueId = req.query.venueId as string;

  const stats = await PlayerStatsModel.find(filter);
  res.json(stats);
});

statsRouter.get('/competition/:competitionId', async (req, res) => {
  const stats = await PlayerStatsModel.find({ competitionId: req.params.competitionId }).sort({
    runs: -1,
  });
  res.json(stats);
});

statsRouter.get('/competition/:competitionId/leaders', async (req, res) => {
  const stats = await PlayerStatsModel.find({ competitionId: req.params.competitionId });
  const topRunScorer = [...stats].sort((a, b) => b.runs - a.runs)[0];
  const topWicketTaker = [...stats].sort((a, b) => b.wickets - a.wickets)[0];
  res.json({ topRunScorer, topWicketTaker, playerCount: stats.length });
});
