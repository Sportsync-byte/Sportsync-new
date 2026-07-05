import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { CourtModel } from '../models/court.js';
import { CompetitionModel } from '../models/competition.js';
import { PlayerModel } from '../models/player.js';
import { canVenueSendSms, sendBulkSms, formatFixtureReminder, isSmsConfigured } from '../services/sms.js';
import { requireUserVenue, requireFixtureAccess } from '../middleware/venue-scope.js';

export const notificationsRouter = Router();

const manageRoles = [authMiddleware, requireRole('owner', 'admin', 'competition-manager')];

notificationsRouter.get('/sms/status/:venueId', authMiddleware, async (req: AuthRequest, res) => {
  if (!requireUserVenue(req, res, String(req.params.venueId))) return;
  const check = await canVenueSendSms(String(req.params.venueId));
  res.json({
    configured: isSmsConfigured(),
    enabled: check.ok,
    error: check.error,
  });
});

notificationsRouter.post('/sms/send', ...manageRoles, async (req: AuthRequest, res) => {
  const { venueId, to, message } = req.body;
  if (!venueId || !to?.length || !message) {
    res.status(400).json({ error: 'venueId, to (array), and message are required' });
    return;
  }
  if (!requireUserVenue(req, res, venueId)) return;

  const check = await canVenueSendSms(venueId);
  if (!check.ok) {
    res.status(403).json({ error: check.error });
    return;
  }

  const result = await sendBulkSms(to, message);
  res.json(result);
});

async function collectFixturePhones(homeTeamId: string, awayTeamId: string): Promise<string[]> {
  const players = await PlayerModel.find({
    teamIds: { $in: [homeTeamId, awayTeamId] },
    phone: { $exists: true, $ne: '' },
    smsOptOut: { $ne: true },
  });
  return [...new Set(players.map((p) => p.phone).filter(Boolean) as string[])];
}

notificationsRouter.post('/sms/fixture/:fixtureId', ...manageRoles, async (req: AuthRequest, res) => {
  const fixtureId = String(req.params.fixtureId);
  if (!(await requireFixtureAccess(req, res, fixtureId))) return;

  const fixture = await FixtureModel.findOne({ id: fixtureId });
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }

  const check = await canVenueSendSms(fixture.venueId);
  if (!check.ok) {
    res.status(403).json({ error: check.error });
    return;
  }

  let to: string[] = req.body.to ?? [];
  if (req.body.useRoster || to.length === 0) {
    to = await collectFixturePhones(fixture.homeTeamId, fixture.awayTeamId);
    if (to.length === 0) {
      res.status(400).json({ error: 'No subscribed players with phone numbers on these teams' });
      return;
    }
  }

  const [homeTeam, awayTeam, court, competition] = await Promise.all([
    TeamModel.findOne({ id: fixture.homeTeamId }),
    TeamModel.findOne({ id: fixture.awayTeamId }),
    fixture.courtId ? CourtModel.findOne({ id: fixture.courtId }) : null,
    CompetitionModel.findOne({ id: fixture.competitionId }),
  ]);

  const message = formatFixtureReminder({
    homeTeam: homeTeam?.name || fixture.homeTeamId,
    awayTeam: awayTeam?.name || fixture.awayTeamId,
    scheduledAt: fixture.scheduledAt ?? undefined,
    courtName: court?.name,
    competitionName: competition?.name,
  });

  const result = await sendBulkSms(to, message);
  res.json({ ...result, message, recipientCount: to.length });
});

notificationsRouter.post('/sms/run-scheduler', authMiddleware, requireRole('owner', 'admin'), async (_req, res) => {
  const result = await import('../services/sms-scheduler.js').then((m) => m.processScheduledSmsReminders());
  res.json(result);
});
