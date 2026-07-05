import { Router } from 'express';
import { VenueModel } from '../models/venue.js';
import { CourtModel } from '../models/court.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { newId } from '../utils/id.js';

export const venuesRouter = Router();

venuesRouter.get('/', async (_req, res) => {
  const venues = await VenueModel.find().sort({ name: 1 });
  res.json(venues);
});

venuesRouter.get('/slug/:slug', async (req, res) => {
  const venue = await VenueModel.findOne({ slug: req.params.slug });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(venue);
});

venuesRouter.get('/:venueId', async (req, res) => {
  const venue = await VenueModel.findOne({ id: req.params.venueId });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(venue);
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
  });

  const courts = [];
  for (let i = 0; i < (courtCount || 1); i++) {
    courts.push({
      id: newId(),
      venueId: id,
      name: `Court ${i + 1}`,
      displayOrder: i,
    });
  }
  await CourtModel.insertMany(courts);

  res.status(201).json(venue);
});

venuesRouter.get('/:venueId/courts', async (req, res) => {
  const courts = await CourtModel.find({ venueId: req.params.venueId }).sort({ displayOrder: 1 });
  res.json(courts);
});

venuesRouter.patch('/:venueId', authMiddleware, requireRole('admin', 'owner'), async (req, res) => {
  const venue = await VenueModel.findOneAndUpdate(
    { id: req.params.venueId },
    { $set: req.body },
    { new: true }
  );
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(venue);
});
