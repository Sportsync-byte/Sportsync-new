import { Router } from 'express';
import { VenueModel } from '../models/venue.js';
import { ScoreboardDeviceModel } from '../models/scoreboard-device.js';
import { canActivateScoreboard } from '../services/license.js';
import { generateDeviceToken } from '../utils/license.js';
import { newId } from '../utils/id.js';

export const licensesRouter = Router();

licensesRouter.post('/activate', async (req, res) => {
  const { licenseKey, deviceName, courtId } = req.body;
  if (!licenseKey || !deviceName) {
    res.status(400).json({ error: 'licenseKey and deviceName are required' });
    return;
  }

  const venue = await VenueModel.findOne({ licenseKey: String(licenseKey).trim().toUpperCase() });
  if (!venue) {
    res.status(404).json({ error: 'Invalid licence key' });
    return;
  }

  const check = await canActivateScoreboard(venue.id);
  if (!check.ok) {
    res.status(403).json({ error: check.error });
    return;
  }

  const deviceToken = generateDeviceToken();
  const device = await ScoreboardDeviceModel.create({
    id: newId(),
    venueId: venue.id,
    name: deviceName,
    deviceToken,
    courtId: courtId || undefined,
    lastSeenAt: new Date().toISOString(),
    status: 'active',
  });

  res.status(201).json({
    deviceToken,
    deviceId: device.id,
    venueId: venue.id,
    venueName: venue.name,
  });
});

licensesRouter.get('/validate/:licenseKey', async (req, res) => {
  const venue = await VenueModel.findOne({
    licenseKey: String(req.params.licenseKey).trim().toUpperCase(),
  });
  if (!venue) {
    res.status(404).json({ error: 'Invalid licence key' });
    return;
  }

  const limit = await import('../services/license.js').then((m) => m.getVenueScoreboardLimit(venue.id));
  const active = await import('../services/license.js').then((m) => m.countActiveScoreboards(venue.id));

  res.json({
    valid: true,
    venueName: venue.name,
    productTier: venue.productTier,
    scoreboardsRemaining: Math.max(0, limit - active),
  });
});
