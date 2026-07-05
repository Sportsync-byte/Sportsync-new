import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { CourtModel } from '../models/court.js';
import { CompetitionModel } from '../models/competition.js';
import { canVenueSendSms, sendBulkSms, formatFixtureReminder, isSmsConfigured } from '../services/sms.js';

export const notificationsRouter = Router();

notificationsRouter.get('/sms/status/:venueId', authMiddleware, async (req, res) => {
  const check = await canVenueSendSms(String(req.params.venueId));
  res.json({
    configured: isSmsConfigured(),
    enabled: check.ok,
    error: check.error,
  });
});

notificationsRouter.post('/sms/send', authMiddleware, requireRole('owner', 'admin', 'competition-manager'), async (req: AuthRequest, res) => {
  const { venueId, to, message } = req.body;
  if (!venueId || !to?.length || !message) {
    res.status(400).json({ error: 'venueId, to (array), and message are required' });
    return;
  }

  const check = await canVenueSendSms(venueId);
  if (!check.ok) {
    res.status(403).json({ error: check.error });
    return;
  }

  const result = await sendBulkSms(to, message);
  res.json(result);
});

notificationsRouter.post('/sms/fixture/:fixtureId', authMiddleware, requireRole('owner', 'admin', 'competition-manager'), async (req: AuthRequest, res) => {
  const { to } = req.body;
  if (!to?.length) {
    res.status(400).json({ error: 'to (array of phone numbers) is required' });
    return;
  }

  const fixture = await FixtureModel.findOne({ id: req.params.fixtureId });
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return;
  }

  const check = await canVenueSendSms(fixture.venueId);
  if (!check.ok) {
    res.status(403).json({ error: check.error });
    return;
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
  res.json({ ...result, message });
});

notificationsRouter.post('/sms/run-scheduler', authMiddleware, requireRole('owner', 'admin'), async (_req, res) => {
  const result = await import('../services/sms-scheduler.js').then((m) => m.processScheduledSmsReminders());
  res.json(result);
});
