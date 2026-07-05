import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  recordBall,
  undoLastBall,
  getScoreboardDisplay,
  setBatters,
  setBowler,
  startInnings,
  startNextPartnership,
  type RecordBallInput,
} from '@sportsync/sport-rules';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';
import { completeFixtureFromMatchState } from '../services/match-completion.js';
import { getNetballScoreboard } from '@sportsync/sport-rules';
import type { NetballMatchState } from '@sportsync/shared';
import { registerNetballHandlers } from './netball.js';
import { registerFootballHandlers } from './football.js';
import { registerBasketballHandlers } from './basketball.js';
import { registerTouchRugbyHandlers } from './touch-rugby.js';
import { setupSocketAuth, rejectUnauthorizedScore } from '../middleware/socket-auth.js';
import { getFootballScoreboard, getBasketballScoreboard, getTouchRugbyScoreboard } from '@sportsync/sport-rules';
import type { IndoorFootballMatchState, BasketballMatchState, TouchRugbyMatchState } from '@sportsync/shared';

async function persistCricket(
  io: Server,
  matchId: string,
  state: IndoorCricketMatchState,
  venueId?: string
) {
  await MatchStateModel.updateOne({ matchId }, { state });
  const scoreboard = getScoreboardDisplay(state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
  if (venueId) {
    io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard, sport: 'indoor-cricket' });
  }
  if (state.status === 'completed') {
    await completeFixtureFromMatchState(matchId, 'indoor-cricket', state);
  }
  return scoreboard;
}

export function setupSocketIO(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  setupSocketAuth(io);
  registerNetballHandlers(io);
  registerFootballHandlers(io);
  registerBasketballHandlers(io);
  registerTouchRugbyHandlers(io);

  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.MATCH_JOIN, async (matchId: string) => {
      socket.join(`match:${matchId}`);
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc) return;

      socket.emit(SOCKET_EVENTS.MATCH_STATE, doc.state);
      if (doc.sport === 'indoor-netball') {
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getNetballScoreboard(doc.state as NetballMatchState));
      } else if (doc.sport === 'indoor-football') {
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getFootballScoreboard(doc.state as IndoorFootballMatchState));
      } else if (doc.sport === 'basketball') {
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getBasketballScoreboard(doc.state as BasketballMatchState));
      } else if (doc.sport === 'touch-rugby') {
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getTouchRugbyScoreboard(doc.state as TouchRugbyMatchState));
      } else {
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getScoreboardDisplay(doc.state as IndoorCricketMatchState));
      }
    });

    socket.on('venue:join', (venueId: string) => {
      socket.join(`venue:${venueId}`);
    });

    socket.on(SOCKET_EVENTS.MATCH_LEAVE, (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on(
      SOCKET_EVENTS.MATCH_SETUP,
      async (payload: {
        matchId: string;
        action: 'start-innings' | 'set-batters' | 'set-bowler' | 'next-partnership';
        strikerId?: string;
        nonStrikerId?: string;
        bowlerId?: string;
      }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-cricket') return;

        let state = doc.state as IndoorCricketMatchState;
        switch (payload.action) {
          case 'start-innings':
            state = startInnings(state);
            break;
          case 'set-batters':
            if (payload.strikerId && payload.nonStrikerId) {
              state = setBatters(state, payload.strikerId, payload.nonStrikerId);
            }
            break;
          case 'set-bowler':
            if (payload.bowlerId) state = setBowler(state, payload.bowlerId);
            break;
          case 'next-partnership':
            if (payload.strikerId && payload.nonStrikerId) {
              state = startNextPartnership(state, payload.strikerId, payload.nonStrikerId);
            }
            break;
        }
        await persistCricket(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(
      SOCKET_EVENTS.MATCH_BALL,
      async (payload: { matchId: string; ball: RecordBallInput }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-cricket') return;
        const state = recordBall(doc.state as IndoorCricketMatchState, payload.ball);
        await persistCricket(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.MATCH_UNDO, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-cricket') return;
      const state = undoLastBall(doc.state as IndoorCricketMatchState);
      await persistCricket(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.MATCH_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-cricket') return;
        const state = structuredClone(doc.state) as IndoorCricketMatchState;
        const innings = state.innings[state.battingTeamIndex];
        innings.timerSeconds = payload.timerSeconds;
        innings.timerRunning = payload.timerRunning;
        if (payload.timerSeconds === 0) {
          innings.timerExpired = true;
          innings.timerRunning = false;
        }
        await persistCricket(io, payload.matchId, state, doc.venueId);
      }
    );
  });

  return io;
}
