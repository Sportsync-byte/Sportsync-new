import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  createStadiumCheckoutSession,
  getBillingStatus,
  isStripeConfigured,
} from '../services/billing.js';

export const billingRouter = Router();

billingRouter.get('/status/:venueId', authMiddleware, async (req, res) => {
  const status = await getBillingStatus(String(req.params.venueId));
  if (!status) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json(status);
});

billingRouter.post('/checkout', authMiddleware, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  const { venueId } = req.body;
  if (!venueId) {
    res.status(400).json({ error: 'venueId is required' });
    return;
  }

  if (!isStripeConfigured()) {
    res.status(503).json({ error: 'Stripe billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_STADIUM_PRICE_ID.' });
    return;
  }

  try {
    const session = await createStadiumCheckoutSession(venueId, req.user?.email);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Checkout failed' });
  }
});
