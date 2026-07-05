import type { Response } from 'express';
import type { AuthRequest } from './auth.js';
import { TeamModel } from '../models/team.js';
import { PlayerModel } from '../models/player.js';
import { CompetitionModel } from '../models/competition.js';
import { FixtureModel } from '../models/fixture.js';

export function requireUserVenue(req: AuthRequest, res: Response, venueId: string): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  if (req.user.venueId !== venueId) {
    res.status(403).json({ error: 'Access denied for this venue' });
    return false;
  }
  return true;
}

export async function requireTeamAccess(req: AuthRequest, res: Response, teamId: string): Promise<boolean> {
  const team = await TeamModel.findOne({ id: teamId });
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return false;
  }
  return requireUserVenue(req, res, team.venueId);
}

export async function requirePlayerAccess(req: AuthRequest, res: Response, playerId: string): Promise<boolean> {
  const player = await PlayerModel.findOne({ id: playerId });
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return false;
  }
  return requireUserVenue(req, res, player.venueId);
}

export async function requireCompetitionAccess(
  req: AuthRequest,
  res: Response,
  competitionId: string
): Promise<boolean> {
  const competition = await CompetitionModel.findOne({ id: competitionId });
  if (!competition) {
    res.status(404).json({ error: 'Competition not found' });
    return false;
  }
  return requireUserVenue(req, res, competition.venueId);
}

export async function requireFixtureAccess(req: AuthRequest, res: Response, fixtureId: string): Promise<boolean> {
  const fixture = await FixtureModel.findOne({ id: fixtureId });
  if (!fixture) {
    res.status(404).json({ error: 'Fixture not found' });
    return false;
  }
  return requireUserVenue(req, res, fixture.venueId);
}
