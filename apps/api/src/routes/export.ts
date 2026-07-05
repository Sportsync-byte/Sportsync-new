import { Router } from 'express';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { PlayerStatsModel } from '../models/player-stats.js';
import { MatchStateModel } from '../models/match-state.js';
import { checkAdvancedReporting } from '../services/subscription.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

export const exportRouter = Router();

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

exportRouter.get('/competition/:competitionId/ladder.csv', authMiddleware, async (req: AuthRequest, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  const canExport = await checkAdvancedReporting(competition.venueId);
  if (!canExport && req.user?.role !== 'owner') {
    res.status(403).json({ error: 'CSV export requires Stadium tier or owner role' });
    return;
  }

  await CompetitionModel.findOne({ id: competition.id });
  const fixtures = await FixtureModel.find({ competitionId: competition.id });
  const teams = await TeamModel.find({ id: { $in: competition.teamIds } });
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const ladder = competition.ladder?.length
    ? competition.ladder
    : (await import('../services/ladder.js')).buildLadderFromFixtures(competition, fixtures);

  const headers = ['Position', 'Team', 'Played', 'Won', 'Lost', 'Tied', 'Points', 'Bonus'];
  const rows = ladder.map((e) =>
    [e.position, teamMap[e.teamId] || e.teamId, e.played, e.won, e.lost, e.tied, e.points, e.bonusPoints]
      .map(escapeCsv)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${competition.name}-ladder.csv"`);
  res.send(csv);
});

exportRouter.get('/match/:matchId/scorecard.csv', async (req, res) => {
  const doc = await MatchStateModel.findOne({ matchId: req.params.matchId });
  if (!doc) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const state = doc.state as { innings?: { teamId: string; totalRuns: number; wickets: number; ballHistory: unknown[] }[] };
  const teams = await TeamModel.find({
    id: { $in: state.innings?.map((i) => i.teamId) || [] },
  });
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const lines = ['Team,Runs,Wickets,Balls'];
  for (const innings of state.innings || []) {
    lines.push(
      [teamMap[innings.teamId] || innings.teamId, innings.totalRuns, innings.wickets, innings.ballHistory?.length || 0]
        .map(escapeCsv)
        .join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="scorecard-${req.params.matchId}.csv"`);
  res.send(lines.join('\n'));
});

exportRouter.get('/competition/:competitionId/stats.csv', authMiddleware, async (req: AuthRequest, res) => {
  const competition = await CompetitionModel.findOne({ id: req.params.competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }

  const stats = await PlayerStatsModel.find({ competitionId: competition.id }).sort({ runs: -1 });
  const headers = ['PlayerId', 'Matches', 'Runs', 'Wickets', 'Catches', 'Fours', 'Sixes'];
  const rows = stats.map((s) =>
    [s.playerId, s.matchesPlayed, s.runs, s.wickets, s.catches, s.fours, s.sixes].map(escapeCsv).join(',')
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${competition.name}-stats.csv"`);
  res.send([headers.join(','), ...rows].join('\n'));
});
