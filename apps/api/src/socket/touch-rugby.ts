import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  startTouchRugbyMatch,
  recordTouchRugbyTry,
  undoLastTouchRugbyTry,
  endTouchRugbyHalf,
  getTouchRugbyScoreboard,
} from '@sportsync/sport-rules';
import type { TouchRugbyMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';
import { completeFixtureFromMatchState } from '../services/match-completion.js';
import { rejectUnauthorizedScore } from '../middleware/socket-auth.js';

async function persistTouchRugby(
  io: Server,
  matchId: string,
  state: TouchRugbyMatchState,
  venueId: string
) {
  await MatchStateModel.updateOne({ matchId }, { state });
  const scoreboard = getTouchRugbyScoreboard(state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
  io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard, sport: 'touch-rugby' });

  if (state.status === 'completed') {
    await completeFixtureFromMatchState(matchId, 'touch-rugby', state);
  }
}

export function registerTouchRugbyHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.TOUCH_RUGBY_START, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'touch-rugby') return;
      const state = startTouchRugbyMatch(doc.state as TouchRugbyMatchState);
      await persistTouchRugby(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.TOUCH_RUGBY_TRY,
      async (payload: { matchId: string; teamId: string; scorerId: string; assistedById?: string }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'touch-rugby') return;
        const state = recordTouchRugbyTry(
          doc.state as TouchRugbyMatchState,
          payload.teamId,
          payload.scorerId,
          payload.assistedById
        );
        await persistTouchRugby(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.TOUCH_RUGBY_END_HALF, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'touch-rugby') return;
      const state = endTouchRugbyHalf(doc.state as TouchRugbyMatchState);
      await persistTouchRugby(io, matchId, state, doc.venueId);
    });

    socket.on(SOCKET_EVENTS.TOUCH_RUGBY_UNDO, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'touch-rugby') return;
      const state = undoLastTouchRugbyTry(doc.state as TouchRugbyMatchState);
      await persistTouchRugby(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.TOUCH_RUGBY_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'touch-rugby') return;
        const state = structuredClone(doc.state) as TouchRugbyMatchState;
        state.timerSeconds = payload.timerSeconds;
        state.timerRunning = payload.timerRunning;
        if (payload.timerSeconds === 0) {
          state.timerExpired = true;
          state.timerRunning = false;
        }
        await persistTouchRugby(io, payload.matchId, state, doc.venueId);
      }
    );
  });
}
