import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  recordBall,
  undoLastBall,
  getScoreboardDisplay,
  type RecordBallInput,
} from '@sportsync/sport-rules';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';

export function setupSocketIO(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.MATCH_JOIN, async (matchId: string) => {
      socket.join(`match:${matchId}`);
      const doc = await MatchStateModel.findOne({ matchId });
      if (doc) {
        socket.emit(SOCKET_EVENTS.MATCH_STATE, doc.state);
        socket.emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, getScoreboardDisplay(doc.state));
      }
    });

    socket.on(SOCKET_EVENTS.MATCH_LEAVE, (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on(
      SOCKET_EVENTS.MATCH_BALL,
      async (payload: { matchId: string; ball: RecordBallInput }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc) return;

        const updatedState = recordBall(doc.state as IndoorCricketMatchState, payload.ball);
        doc.state = updatedState;
        await doc.save();

        const scoreboard = getScoreboardDisplay(updatedState);
        io.to(`match:${payload.matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, updatedState);
        io.to(`match:${payload.matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
      }
    );

    socket.on(SOCKET_EVENTS.MATCH_UNDO, async (matchId: string) => {
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc) return;

      const updatedState = undoLastBall(doc.state as IndoorCricketMatchState);
      doc.state = updatedState;
      await doc.save();

      const scoreboard = getScoreboardDisplay(updatedState);
      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, updatedState);
      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
    });

    socket.on(
      SOCKET_EVENTS.MATCH_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc) return;

        const state = doc.state as IndoorCricketMatchState;
        const innings = state.innings[state.battingTeamIndex];
        innings.timerSeconds = payload.timerSeconds;
        innings.timerRunning = payload.timerRunning;
        doc.state = state;
        await doc.save();

        io.to(`match:${payload.matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
        io.to(`match:${payload.matchId}`).emit(
          SOCKET_EVENTS.SCOREBOARD_UPDATE,
          getScoreboardDisplay(state)
        );
      }
    );

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
