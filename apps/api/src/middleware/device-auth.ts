import type { Request, Response, NextFunction } from 'express';
import { ScoreboardDeviceModel } from '../models/scoreboard-device.js';

export interface DeviceRequest extends Request {
  device?: {
    id: string;
    venueId: string;
    name: string;
    courtId?: string;
    assignedMatchId?: string;
  };
}

export async function deviceAuthMiddleware(req: DeviceRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Device ')) {
    res.status(401).json({ error: 'Scoreboard device token required' });
    return;
  }

  const token = header.slice(7);
  const device = await ScoreboardDeviceModel.findOne({ deviceToken: token, status: 'active' });
  if (!device) {
    res.status(401).json({ error: 'Invalid or revoked device token' });
    return;
  }

  req.device = {
    id: device.id,
    venueId: device.venueId,
    name: device.name,
    courtId: device.courtId ?? undefined,
    assignedMatchId: device.assignedMatchId ?? undefined,
  };
  next();
}
