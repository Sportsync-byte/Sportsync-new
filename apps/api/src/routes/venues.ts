import { Router } from 'express';
import { VenueModel } from '../models/venue.js';
import { CourtModel } from '../models/court.js';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js';
import { enrichVenue } from '../utils/venue.js';
import { newId } from '../utils/id.js';
import { generateLicenseKey } from '../utils/license.js';
import { getVenueScoreboardLimit, countActiveScoreboards } from '../services/license.js';
import { requireUserVenue } from '../middleware/venue-scope.js';
import { checkCanAddCourt } from '../services/subscription.js';

const manageRoles = [authMiddleware, requireRole('owner', 'admin', 'competition-manager')];

export const venuesRouter = Router();

venuesRouter.get('/', async (_req, res) => {
  const venues = await VenueModel.find().sort({ name: 1 });
  res.json(venues.map((v) => enrichVenue(v.toObject())));
});

venuesRouter.get('/slug/:slug', async (req, res) => {
  const venue = await VenueModel.findOne({ slug: req.params.slug });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(enrichVenue(venue.toObject()));
});

venuesRouter.get('/:venueId', async (req, res) => {
  const venue = await VenueModel.findOne({ id: req.params.venueId });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(enrichVenue(venue.toObject()));
});

venuesRouter.post('/', authMiddleware, requireRole('admin', 'owner'), async (req, res) => {
  const { name, slug, productTier, branding, courtCount, sports } = req.body;
  const id = newId();
  const venue = await VenueModel.create({
    id,
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    productTier: productTier || 'club',
    branding: branding || {},
    courtCount: courtCount || 1,
    sports: sports || ['indoor-cricket'],
    licenseKey: generateLicenseKey(),
    smsEnabled: productTier === 'stadium',
  });

  const courts = [];
  for (let i = 0; i < (courtCount || 1); i++) {
    courts.push({
      id: newId(),
      venueId: id,
      name: `Court ${i + 1}`,
      number: i + 1,
      displayOrder: i,
    });
  }
  await CourtModel.insertMany(courts);

  res.status(201).json(enrichVenue(venue.toObject()));
});

venuesRouter.get('/:venueId/license', authMiddleware, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  if (!requireUserVenue(req, res, String(req.params.venueId))) return;
  const venue = await VenueModel.findOne({ id: req.params.venueId });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  const limit = await getVenueScoreboardLimit(venue.id);
  const active = await countActiveScoreboards(venue.id);
  res.json({
    licenseKey: venue.licenseKey,
    maxScoreboards: limit,
    activeScoreboards: active,
    extraScoreboards: venue.extraScoreboards ?? 0,
    smsEnabled: venue.smsEnabled ?? false,
  });
});

venuesRouter.post('/:venueId/extra-scoreboards', authMiddleware, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  if (!requireUserVenue(req, res, String(req.params.venueId))) return;
  const { count = 1 } = req.body;
  const venue = await VenueModel.findOneAndUpdate(
    { id: req.params.venueId },
    { $inc: { extraScoreboards: count } },
    { new: true }
  );
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(enrichVenue(venue.toObject()));
});

venuesRouter.get('/:venueId/courts', async (req, res) => {
  const courts = await CourtModel.find({ venueId: req.params.venueId }).sort({ displayOrder: 1 });
  res.json(courts);
});

venuesRouter.post('/:venueId/courts', ...manageRoles, async (req: AuthRequest, res) => {
  const venueId = String(req.params.venueId);
  if (!requireUserVenue(req, res, venueId)) return;

  const courtCheck = await checkCanAddCourt(venueId);
  if (!courtCheck.ok) {
    res.status(403).json({ error: courtCheck.error });
    return;
  }

  const { name, sport } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const existing = await CourtModel.find({ venueId }).sort({ number: -1 }).limit(1);
  const displayOrder = (existing[0]?.displayOrder ?? -1) + 1;
  const number = (existing[0]?.number ?? 0) + 1;

  const court = await CourtModel.create({
    id: newId(),
    venueId,
    name,
    number,
    sport,
    displayOrder,
  });

  await VenueModel.updateOne({ id: venueId }, { $inc: { courtCount: 1 } });
  res.status(201).json(court);
});

venuesRouter.patch('/:venueId/courts/:courtId', ...manageRoles, async (req: AuthRequest, res) => {
  const venueId = String(req.params.venueId);
  if (!requireUserVenue(req, res, venueId)) return;

  const court = await CourtModel.findOneAndUpdate(
    { id: req.params.courtId, venueId },
    { $set: req.body },
    { new: true }
  );
  if (!court) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }
  res.json(court);
});

venuesRouter.delete('/:venueId/courts/:courtId', ...manageRoles, async (req: AuthRequest, res) => {
  const venueId = String(req.params.venueId);
  if (!requireUserVenue(req, res, venueId)) return;

  const result = await CourtModel.deleteOne({ id: req.params.courtId, venueId });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }
  await VenueModel.updateOne({ id: venueId }, { $inc: { courtCount: -1 } });
  res.status(204).send();
});

venuesRouter.patch('/:venueId', authMiddleware, requireRole('admin', 'owner'), async (req: AuthRequest, res) => {
  if (!requireUserVenue(req, res, String(req.params.venueId))) return;
  const venue = await VenueModel.findOneAndUpdate(
    { id: req.params.venueId },
    { $set: req.body },
    { new: true }
  );
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(enrichVenue(venue.toObject()));
});
