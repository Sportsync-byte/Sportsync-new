import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { connectDatabase } from './config/database.js';
import { matchesRouter } from './routes/matches.js';
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
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sportsync-api' });
});

app.use('/api/matches', matchesRouter);

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
