import { Router } from 'express';
import type { IndoorCricketMatchState, NetballMatchState } from '@sportsync/shared';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { PlayerStatsModel } from '../models/player-stats.js';
import { MatchStateModel } from '../models/match-state.js';
import { checkAdvancedReporting } from '../services/subscription.js';
import { streamPdf, writeScorecardPdf, writeLadderPdf } from '../services/pdf.js';
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

async function requireExportAccess(competitionId: string, userRole?: string) {
  const competition = await CompetitionModel.findOne({ id: competitionId });
  if (!competition) return { ok: false as const, status: 404, error: 'Competition not found' };

  const canExport = await checkAdvancedReporting(competition.venueId);
  if (!canExport && userRole !== 'owner') {
    return { ok: false as const, status: 403, error: 'Export requires Stadium tier or owner role' };
  }
  return { ok: true as const, competition };
}

exportRouter.get('/competition/:competitionId/ladder.csv', authMiddleware, async (req: AuthRequest, res) => {
  const access = await requireExportAccess(String(req.params.competitionId), req.user?.role);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const { competition } = access;

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

exportRouter.get('/competition/:competitionId/ladder.pdf', authMiddleware, async (req: AuthRequest, res) => {
  const access = await requireExportAccess(String(req.params.competitionId), req.user?.role);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const { competition } = access;

  const fixtures = await FixtureModel.find({ competitionId: competition.id });
  const teams = await TeamModel.find({ id: { $in: competition.teamIds } });
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const ladder = competition.ladder?.length
    ? competition.ladder
    : (await import('../services/ladder.js')).buildLadderFromFixtures(competition, fixtures);

  streamPdf(res, `${competition.name}-ladder.pdf`, (doc) => {
    writeLadderPdf(doc, {
      competitionName: competition.name,
      rows: ladder.map((e) => ({
        position: e.position,
        team: teamMap[e.teamId] || e.teamId,
        played: e.played,
        won: e.won,
        lost: e.lost,
        points: e.points,
      })),
    });
  });
});

exportRouter.get('/match/:matchId/scorecard.csv', async (req, res) => {
  const doc = await MatchStateModel.findOne({ matchId: req.params.matchId });
  if (!doc) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  if (doc.sport === 'indoor-netball') {
    const state = doc.state as NetballMatchState;
    const teams = await TeamModel.find({ id: { $in: [state.homeTeamId, state.awayTeamId] } });
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
    const lines = ['Team,Goals'];
    lines.push([teamMap[state.homeTeamId] || state.homeTeamId, state.homeScore].map(escapeCsv).join(','));
    lines.push([teamMap[state.awayTeamId] || state.awayTeamId, state.awayScore].map(escapeCsv).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="scorecard-${req.params.matchId}.csv"`);
    res.send(lines.join('\n'));
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

exportRouter.get('/match/:matchId/scorecard.pdf', async (req, res) => {
  const doc = await MatchStateModel.findOne({ matchId: req.params.matchId });
  if (!doc) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const fixture = await FixtureModel.findOne({ matchId: req.params.matchId });
  const competition = fixture
    ? await CompetitionModel.findOne({ id: fixture.competitionId })
    : null;

  if (doc.sport === 'indoor-netball') {
    const state = doc.state as NetballMatchState;
    const teams = await TeamModel.find({ id: { $in: [state.homeTeamId, state.awayTeamId] } });
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
    const winner = state.winnerTeamId ? teamMap[state.winnerTeamId] : undefined;
    const details = state.quarterScores.map(
      (q) => `Q${q.quarter}: ${q.homeGoals} – ${q.awayGoals}`
    );

    streamPdf(res, `scorecard-${req.params.matchId}.pdf`, (pdf) => {
      writeScorecardPdf(pdf, {
        title: competition?.name || 'Match',
        sport: 'indoor-netball',
        homeTeam: teamMap[state.homeTeamId] || state.homeTeamId,
        awayTeam: teamMap[state.awayTeamId] || state.awayTeamId,
        homeScore: state.homeScore,
        awayScore: state.awayScore,
        winner,
        details,
      });
    });
    return;
  }

  const state = doc.state as IndoorCricketMatchState;
  const homeTeamId = fixture?.homeTeamId ?? state.innings[0].teamId;
  const awayTeamId = fixture?.awayTeamId ?? state.innings[1].teamId;
  const teams = await TeamModel.find({ id: { $in: [homeTeamId, awayTeamId] } });
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const homeInnings = state.innings.find((i) => i.teamId === homeTeamId) ?? state.innings[0];
  const awayInnings = state.innings.find((i) => i.teamId === awayTeamId) ?? state.innings[1];
  const winner = state.winnerTeamId ? teamMap[state.winnerTeamId] : undefined;

  streamPdf(res, `scorecard-${req.params.matchId}.pdf`, (pdf) => {
    writeScorecardPdf(pdf, {
      title: competition?.name || 'Match',
      sport: 'indoor-cricket',
      homeTeam: teamMap[homeTeamId] || homeTeamId,
      awayTeam: teamMap[awayTeamId] || awayTeamId,
      homeScore: homeInnings.totalRuns,
      awayScore: awayInnings.totalRuns,
      homeWickets: homeInnings.wickets,
      awayWickets: awayInnings.wickets,
      winner,
    });
  });
});

exportRouter.get('/competition/:competitionId/stats.csv', authMiddleware, async (req: AuthRequest, res) => {
  const access = await requireExportAccess(String(req.params.competitionId), req.user?.role);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const { competition } = access;

  const stats = await PlayerStatsModel.find({ competitionId: competition.id });
  const isNetball = competition.sport === 'indoor-netball';

  if (isNetball) {
    const sorted = [...stats].sort((a, b) => b.goals - a.goals);
    const headers = ['PlayerId', 'Matches', 'Goals', 'Assists'];
    const rows = sorted.map((s) =>
      [s.playerId, s.matchesPlayed, s.goals, s.assists].map(escapeCsv).join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${competition.name}-stats.csv"`);
    res.send([headers.join(','), ...rows].join('\n'));
    return;
  }

  const sorted = [...stats].sort((a, b) => b.runs - a.runs);
  const headers = ['PlayerId', 'Matches', 'Runs', 'Wickets', 'Catches', 'Fours', 'Sixes'];
  const rows = sorted.map((s) =>
    [s.playerId, s.matchesPlayed, s.runs, s.wickets, s.catches, s.fours, s.sixes].map(escapeCsv).join(',')
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${competition.name}-stats.csv"`);
  res.send([headers.join(','), ...rows].join('\n'));
});
