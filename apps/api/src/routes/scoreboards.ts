import { Router } from 'express';
import { ScoreboardDeviceModel } from '../models/scoreboard-device.js';
import { VenueModel } from '../models/venue.js';
import { FixtureModel } from '../models/fixture.js';
import { MatchStateModel } from '../models/match-state.js';
import { deviceAuthMiddleware } from '../middleware/device-auth.js';
import type { DeviceRequest } from '../middleware/device-auth.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { enrichVenue } from '../utils/venue.js';
import { getVenueScoreboardLimit, countActiveScoreboards } from '../services/license.js';

export const scoreboardsRouter = Router();

async function resolveMatchForDevice(device: {
  venueId: string;
  courtId?: string;
  assignedMatchId?: string;
}): Promise<{ matchId?: string; sport?: string }> {
  if (device.assignedMatchId) {
    const doc = await MatchStateModel.findOne({ matchId: device.assignedMatchId });
    if (doc) return { matchId: doc.matchId, sport: doc.sport };
  }

  if (device.courtId) {
    const liveFixture = await FixtureModel.findOne({
      venueId: device.venueId,
      courtId: device.courtId,
      status: 'live',
      matchId: { $exists: true },
    }).sort({ updatedAt: -1 });
    if (liveFixture?.matchId) {
      const doc = await MatchStateModel.findOne({ matchId: liveFixture.matchId });
      return { matchId: liveFixture.matchId, sport: doc?.sport };
    }
  }

  const anyLive = await FixtureModel.findOne({
    venueId: device.venueId,
    status: 'live',
    matchId: { $exists: true },
  }).sort({ updatedAt: -1 });
  if (anyLive?.matchId) {
    const doc = await MatchStateModel.findOne({ matchId: anyLive.matchId });
    return { matchId: anyLive.matchId, sport: doc?.sport };
  }

  return {};
}

scoreboardsRouter.get('/me', deviceAuthMiddleware, async (req: DeviceRequest, res) => {
  const device = await ScoreboardDeviceModel.findOne({ id: req.device!.id });
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const venue = await VenueModel.findOne({ id: device.venueId });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  const match = await resolveMatchForDevice({
    venueId: device.venueId,
    courtId: device.courtId ?? undefined,
    assignedMatchId: device.assignedMatchId ?? undefined,
  });

  res.json({
    device: {
      id: device.id,
      venueId: device.venueId,
      name: device.name,
      courtId: device.courtId,
      assignedMatchId: device.assignedMatchId,
      lastSeenAt: device.lastSeenAt,
      status: device.status,
    },
    venue: enrichVenue(venue.toObject()),
    matchId: match.matchId,
    sport: match.sport,
  });
});

scoreboardsRouter.post('/me/heartbeat', deviceAuthMiddleware, async (req: DeviceRequest, res) => {
  await ScoreboardDeviceModel.updateOne(
    { id: req.device!.id },
    { lastSeenAt: new Date().toISOString() }
  );
  const match = await resolveMatchForDevice({
    venueId: req.device!.venueId,
    courtId: req.device!.courtId,
    assignedMatchId: req.device!.assignedMatchId,
  });
  res.json({ ok: true, ...match });
});

scoreboardsRouter.get('/venue/:venueId', authMiddleware, async (req, res) => {
  const devices = await ScoreboardDeviceModel.find({ venueId: req.params.venueId }).sort({ name: 1 });
  const limit = await getVenueScoreboardLimit(String(req.params.venueId));
  const active = await countActiveScoreboards(String(req.params.venueId));
  res.json({ devices, limit, active });
});

scoreboardsRouter.patch('/:deviceId', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  const device = await ScoreboardDeviceModel.findOneAndUpdate(
    { id: req.params.deviceId },
    {
      $set: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.courtId !== undefined ? { courtId: req.body.courtId } : {}),
        ...(req.body.assignedMatchId !== undefined ? { assignedMatchId: req.body.assignedMatchId } : {}),
      },
    },
    { new: true }
  );
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json(device);
});

scoreboardsRouter.delete('/:deviceId', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  const device = await ScoreboardDeviceModel.findOneAndUpdate(
    { id: req.params.deviceId },
    { status: 'revoked' },
    { new: true }
  );
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json(device);
});
