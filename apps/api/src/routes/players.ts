import { Router } from 'express';
import { PlayerModel } from '../models/player.js';
import { TeamModel } from '../models/team.js';
import { PlayerStatsModel } from '../models/player-stats.js';
import { CompetitionModel } from '../models/competition.js';
import { newId } from '../utils/id.js';
import { uniquePlayerSlug } from '../utils/slug.js';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js';
import { requirePlayerAccess, requireUserVenue } from '../middleware/venue-scope.js';
import { normalizePhone } from '../services/sms.js';

export const playersRouter = Router();

const manageRoles = [authMiddleware, requireRole('owner', 'admin', 'competition-manager')];

async function buildPlayerProfile(player: InstanceType<typeof PlayerModel>) {
  const [teams, stats] = await Promise.all([
    TeamModel.find({ id: { $in: player.teamIds } }),
    PlayerStatsModel.find({ playerId: player.id }),
  ]);

  const competitionIds = [...new Set(stats.map((s) => s.competitionId).filter(Boolean))];
  const competitions = await CompetitionModel.find({ id: { $in: competitionIds } });
  const compMap = Object.fromEntries(competitions.map((c) => [c.id, c]));

  return {
    ...player.toObject(),
    teams,
    stats: stats.map((s) => ({
      competitionId: s.competitionId,
      competitionName: compMap[s.competitionId || '']?.name,
      season: compMap[s.competitionId || '']?.season,
      matchesPlayed: s.matchesPlayed,
      runs: s.runs,
      wickets: s.wickets,
      catches: s.catches,
      goals: s.goals,
      assists: s.assists,
    })),
  };
}

playersRouter.get('/public/search', async (req, res) => {
  const { venueId, q } = req.query;
  if (!venueId || !q) {
    res.status(400).json({ error: 'venueId and q are required' });
    return;
  }
  const search = String(q).toLowerCase();
  const players = await PlayerModel.find({ venueId: String(venueId) });
  const filtered = players.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search) ||
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search) ||
      p.slug.toLowerCase().includes(search)
  );
  res.json(filtered.slice(0, 20));
});

playersRouter.get('/public/slug/:slug', async (req, res) => {
  const { venueId } = req.query;
  const filter: Record<string, string> = { slug: req.params.slug };
  if (venueId) filter.venueId = String(venueId);

  const player = await PlayerModel.findOne(filter);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(await buildPlayerProfile(player));
});

playersRouter.get('/public/:playerId', async (req, res) => {
  const player = await PlayerModel.findOne({ id: req.params.playerId });
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(await buildPlayerProfile(player));
});

playersRouter.get('/venue/:venueId', async (req, res) => {
  const filter: Record<string, unknown> = { venueId: req.params.venueId };
  if (req.query.teamId) filter.teamIds = req.query.teamId;
  const players = await PlayerModel.find(filter).sort({ displayName: 1 });
  res.json(players);
});

playersRouter.get('/:playerId', async (req, res) => {
  const player = await PlayerModel.findOne({ id: req.params.playerId });
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(player);
});

playersRouter.post('/', ...manageRoles, async (req: AuthRequest, res) => {
  const { venueId, firstName, lastName, displayName, teamIds, phone } = req.body;
  if (!venueId || !firstName || !lastName) {
    res.status(400).json({ error: 'venueId, firstName, and lastName are required' });
    return;
  }
  if (!requireUserVenue(req, res, venueId)) return;

  if (phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      res.status(400).json({ error: 'Phone must be in E.164 format (e.g. +64211234567)' });
      return;
    }
  }

  const name = displayName || `${firstName} ${lastName}`;
  const slug = await uniquePlayerSlug(venueId, name, async (vId, s) => {
    const existing = await PlayerModel.findOne({ venueId: vId, slug: s });
    return Boolean(existing);
  });

  const rosterTeamIds: string[] = teamIds || [];
  const primaryTeamId = rosterTeamIds[0];
  let number: number | undefined;
  if (primaryTeamId) {
    const last = await PlayerModel.findOne({ team: primaryTeamId }).sort({ number: -1 });
    number = (last?.number ?? 0) + 1;
  }

  const player = await PlayerModel.create({
    id: newId(),
    venueId,
    firstName,
    lastName,
    displayName: name,
    slug,
    teamIds: rosterTeamIds,
    ...(primaryTeamId ? { team: primaryTeamId, number } : {}),
    ...(phone ? { phone: normalizePhone(phone) } : {}),
  });
  res.status(201).json(player);
});

playersRouter.patch('/:playerId', ...manageRoles, async (req: AuthRequest, res) => {
  if (!(await requirePlayerAccess(req, res, String(req.params.playerId)))) return;

  const updates = { ...req.body };
  if (updates.phone !== undefined && updates.phone !== '') {
    const normalized = normalizePhone(String(updates.phone));
    if (!normalized) {
      res.status(400).json({ error: 'Phone must be in E.164 format (e.g. +64211234567)' });
      return;
    }
    updates.phone = normalized;
  }

  const player = await PlayerModel.findOneAndUpdate(
    { id: req.params.playerId },
    { $set: updates },
    { new: true }
  );
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(player);
});

playersRouter.delete('/:playerId', ...manageRoles, async (req: AuthRequest, res) => {
  if (!(await requirePlayerAccess(req, res, String(req.params.playerId)))) return;
  const result = await PlayerModel.deleteOne({ id: req.params.playerId });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.status(204).send();
});
