import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { connectDatabase } from './config/database.js';
import { venuesRouter } from './routes/venues.js';
import { teamsRouter } from './routes/teams.js';
import { playersRouter } from './routes/players.js';
import { competitionsRouter } from './routes/competitions.js';
import { fixturesRouter } from './routes/fixtures.js';
import { matchesRouter } from './routes/matches.js';
import { liveRouter } from './routes/live.js';
import { authRouter } from './routes/auth.js';
import { statsRouter } from './routes/stats.js';
import { exportRouter } from './routes/export.js';
import { billingRouter } from './routes/billing.js';
import { handleStripeWebhook } from './services/billing.js';
import { setupSocketIO } from './socket/index.js';

const PORT = Number(process.env.PORT) || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsync';
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
];

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: CORS_ORIGIN }));

app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }
    try {
      await handleStripeWebhook(req.body as Buffer, signature);
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Webhook failed' });
    }
  }
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sportsync-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);
app.use('/api/stats', statsRouter);
app.use('/api/export', exportRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/competitions', competitionsRouter);
app.use('/api/fixtures', fixturesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/live', liveRouter);

setupSocketIO(httpServer, CORS_ORIGIN);

async function start() {
  try {
    await connectDatabase(MONGODB_URI);
    httpServer.listen(PORT, () => {
      console.log(`SportSync API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
