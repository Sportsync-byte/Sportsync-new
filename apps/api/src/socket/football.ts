import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  startFootballMatch,
  recordFootballGoal,
  endFootballHalf,
  getFootballScoreboard,
} from '@sportsync/sport-rules';
import type { IndoorFootballMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';
import { completeFixtureFromMatchState } from '../services/match-completion.js';
import { rejectUnauthorizedScore } from '../middleware/socket-auth.js';

async function persistFootball(
  io: Server,
  matchId: string,
  state: IndoorFootballMatchState,
  venueId: string
) {
  await MatchStateModel.updateOne({ matchId }, { state });
  const scoreboard = getFootballScoreboard(state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
  io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard, sport: 'indoor-football' });

  if (state.status === 'completed') {
    await completeFixtureFromMatchState(matchId, 'indoor-football', state);
  }
}

export function registerFootballHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.FOOTBALL_START, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-football') return;
      const state = startFootballMatch(doc.state as IndoorFootballMatchState);
      await persistFootball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.FOOTBALL_GOAL,
      async (payload: { matchId: string; teamId: string; scorerId: string; assistedById?: string }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-football') return;
        const state = recordFootballGoal(
          doc.state as IndoorFootballMatchState,
          payload.teamId,
          payload.scorerId,
          payload.assistedById
        );
        await persistFootball(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.FOOTBALL_END_HALF, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-football') return;
      const state = endFootballHalf(doc.state as IndoorFootballMatchState);
      await persistFootball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.FOOTBALL_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-football') return;
        const state = structuredClone(doc.state) as IndoorFootballMatchState;
        state.timerSeconds = payload.timerSeconds;
        state.timerRunning = payload.timerRunning;
        if (payload.timerSeconds === 0) {
          state.timerExpired = true;
          state.timerRunning = false;
        }
        await persistFootball(io, payload.matchId, state, doc.venueId);
      }
    );
  });
}
