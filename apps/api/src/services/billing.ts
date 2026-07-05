import Stripe from 'stripe';
import { VenueModel } from '../models/venue.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stadiumPriceId = process.env.STRIPE_STADIUM_PRICE_ID;
const scoreboardPriceId = process.env.STRIPE_SCOREBOARD_PRICE_ID;
const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecret && stadiumPriceId);
}

export function isScoreboardBillingConfigured(): boolean {
  return Boolean(stripeSecret && scoreboardPriceId);
}

function getStripe(): Stripe {
  if (!stripeSecret) throw new Error('Stripe is not configured');
  return new Stripe(stripeSecret);
}

export async function createStadiumCheckoutSession(venueId: string, customerEmail?: string) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe billing is not configured on this server');
  }

  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) throw new Error('Venue not found');

  const stripe = getStripe();
  let customerId = venue.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: { venueId: venue.id },
      name: venue.name,
    });
    customerId = customer.id;
    await VenueModel.updateOne({ id: venueId }, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: stadiumPriceId!, quantity: 1 }],
    success_url: `${dashboardUrl}/settings?billing=success`,
    cancel_url: `${dashboardUrl}/settings?billing=cancel`,
    metadata: { venueId: venue.id },
    subscription_data: { metadata: { venueId: venue.id } },
  });

  return { url: session.url };
}

export async function createScoreboardCheckoutSession(
  venueId: string,
  quantity = 1,
  customerEmail?: string
) {
  if (!isScoreboardBillingConfigured()) {
    throw new Error('Scoreboard billing is not configured. Set STRIPE_SCOREBOARD_PRICE_ID.');
  }

  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) throw new Error('Venue not found');

  const stripe = getStripe();
  let customerId = venue.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: { venueId: venue.id },
      name: venue.name,
    });
    customerId = customer.id;
    await VenueModel.updateOne({ id: venueId }, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: scoreboardPriceId!, quantity }],
    success_url: `${dashboardUrl}/scoreboards?billing=scoreboard-success`,
    cancel_url: `${dashboardUrl}/scoreboards?billing=cancel`,
    metadata: { venueId: venue.id, type: 'extra-scoreboard', quantity: String(quantity) },
    subscription_data: { metadata: { venueId: venue.id, type: 'extra-scoreboard' } },
  });

  return { url: session.url };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    throw new Error('Stripe webhook is not configured');
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const venueId = session.metadata?.venueId;
      if (!venueId) break;

      if (session.metadata?.type === 'extra-scoreboard') {
        const qty = Number(session.metadata.quantity) || 1;
        await VenueModel.updateOne({ id: venueId }, { $inc: { extraScoreboards: qty } });
        break;
      }

      if (session.subscription) {
        await VenueModel.updateOne(
          { id: venueId },
          {
            productTier: 'stadium',
            stripeSubscriptionId: String(session.subscription),
            billingStatus: 'active',
          }
        );
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const venueId = sub.metadata?.venueId;
      if (venueId) {
        const billingStatus =
          sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
        const update: Record<string, string> = { billingStatus };
        if (sub.status === 'active') update.productTier = 'stadium';
        if (sub.status === 'canceled') update.productTier = 'club';
        await VenueModel.updateOne({ id: venueId }, update);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const venueId = sub.metadata?.venueId;
      if (venueId) {
        await VenueModel.updateOne(
          { id: venueId },
          { productTier: 'club', billingStatus: 'canceled', stripeSubscriptionId: undefined }
        );
      }
      break;
    }
  }

  return { received: true };
}

export async function getBillingStatus(venueId: string) {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return null;
  return {
    productTier: venue.productTier,
    billingStatus: venue.billingStatus || 'none',
    stripeConfigured: isStripeConfigured(),
  };
}
