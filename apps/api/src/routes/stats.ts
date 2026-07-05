import { Router } from 'express';
import { isGoalSport, sortPlayerStatsBySport } from '@sportsync/shared';
import { PlayerStatsModel } from '../models/player-stats.js';
import { CompetitionModel } from '../models/competition.js';

export const statsRouter = Router();

statsRouter.get('/player/:playerId', async (req, res) => {
  const filter: Record<string, string> = { playerId: req.params.playerId };
  if (req.query.competitionId) filter.competitionId = req.query.competitionId as string;
  if (req.query.venueId) filter.venueId = req.query.venueId as string;

  const stats = await PlayerStatsModel.find(filter);
  res.json(stats);
});

statsRouter.get('/competition/:competitionId', async (req, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  const stats = await PlayerStatsModel.find({ competitionId: req.params.competitionId });
  const sport = competition?.sport || 'indoor-cricket';
  res.json(sortPlayerStatsBySport(sport, stats));
});

statsRouter.get('/competition/:competitionId/leaders', async (req, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  const stats = await PlayerStatsModel.find({ competitionId: req.params.competitionId });
  const sport = competition?.sport || 'indoor-cricket';

  if (isGoalSport(sport)) {
    const topScorer = sortPlayerStatsBySport(sport, stats)[0];
    const topAssists = [...stats].sort((a, b) => b.assists - a.assists)[0];
    res.json({ topScorer, topAssists, playerCount: stats.length, sport });
    return;
  }

  const topRunScorer = [...stats].sort((a, b) => b.runs - a.runs)[0];
  const topWicketTaker = [...stats].sort((a, b) => b.wickets - a.wickets)[0];
  res.json({ topRunScorer, topWicketTaker, playerCount: stats.length, sport });
});
