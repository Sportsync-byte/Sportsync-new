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
import { completeFixtureFromMatch } from '../routes/fixtures.js';

async function persistAndBroadcast(
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
    io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard });
  }

  if (state.status === 'completed') {
    await completeFixtureFromMatch(matchId, state);
  }

  return scoreboard;
}

export function setupSocketIO(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.MATCH_JOIN, async (matchId: string) => {
      socket.join(`match:${matchId}`);
      const doc = await MatchStateModel.findOne({ matchId });
      if (doc) {
        socket.emit(SOCKET_EVENTS.MATCH_STATE, doc.state);
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getScoreboardDisplay(doc.state));
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
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc) return;

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

        await persistAndBroadcast(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(
      SOCKET_EVENTS.MATCH_BALL,
      async (payload: { matchId: string; ball: RecordBallInput }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc) return;

        const state = recordBall(doc.state as IndoorCricketMatchState, payload.ball);
        await persistAndBroadcast(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.MATCH_UNDO, async (matchId: string) => {
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc) return;

      const state = undoLastBall(doc.state as IndoorCricketMatchState);
      await persistAndBroadcast(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.MATCH_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc) return;

        const state = structuredClone(doc.state) as IndoorCricketMatchState;
        const innings = state.innings[state.battingTeamIndex];
        innings.timerSeconds = payload.timerSeconds;
        innings.timerRunning = payload.timerRunning;
        await persistAndBroadcast(io, payload.matchId, state, doc.venueId);
      }
    );
  });

  return io;
}
