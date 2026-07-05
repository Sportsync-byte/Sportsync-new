import { Router } from 'express';
import { TeamModel } from '../models/team.js';
import { newId } from '../utils/id.js';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js';
import { requireTeamAccess, requireUserVenue } from '../middleware/venue-scope.js';

export const teamsRouter = Router();

const manageRoles = [authMiddleware, requireRole('owner', 'admin', 'competition-manager')];

teamsRouter.get('/venue/:venueId', async (req, res) => {
  const teams = await TeamModel.find({ venueId: req.params.venueId }).sort({ name: 1 });
  res.json(teams);
});

teamsRouter.get('/:teamId', async (req, res) => {
  const team = await TeamModel.findOne({ id: req.params.teamId });
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json(team);
});

teamsRouter.post('/', ...manageRoles, async (req: AuthRequest, res) => {
  const { venueId, name, shortName, colors, logoUrl, captainId, coachId } = req.body;
  if (!venueId || !name) {
    res.status(400).json({ error: 'venueId and name are required' });
    return;
  }
  if (!requireUserVenue(req, res, venueId)) return;

  const team = await TeamModel.create({
    id: newId(),
    venueId,
    name,
    shortName,
    colors: colors || { primary: '#00c896', secondary: '#ffffff' },
    logoUrl,
    captainId,
    coachId,
  });
  res.status(201).json(team);
});

teamsRouter.patch('/:teamId', ...manageRoles, async (req: AuthRequest, res) => {
  if (!(await requireTeamAccess(req, res, String(req.params.teamId)))) return;
  const team = await TeamModel.findOneAndUpdate(
    { id: req.params.teamId },
    { $set: req.body },
    { new: true }
  );
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json(team);
});

teamsRouter.delete('/:teamId', ...manageRoles, async (req: AuthRequest, res) => {
  if (!(await requireTeamAccess(req, res, String(req.params.teamId)))) return;
  const result = await TeamModel.deleteOne({ id: req.params.teamId });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.status(204).send();
});
