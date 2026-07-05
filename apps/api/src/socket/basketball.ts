import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  startBasketballMatch,
  recordBasket,
  undoLastBasket,
  endBasketballQuarter,
  getBasketballScoreboard,
} from '@sportsync/sport-rules';
import type { BasketballMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';
import { completeFixtureFromMatchState } from '../services/match-completion.js';
import { rejectUnauthorizedScore } from '../middleware/socket-auth.js';

async function persistBasketball(
  io: Server,
  matchId: string,
  state: BasketballMatchState,
  venueId: string
) {
  await MatchStateModel.updateOne({ matchId }, { state });
  const scoreboard = getBasketballScoreboard(state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
  io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard, sport: 'basketball' });

  if (state.status === 'completed') {
    await completeFixtureFromMatchState(matchId, 'basketball', state);
  }
}

export function registerBasketballHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.BASKETBALL_START, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'basketball') return;
      const state = startBasketballMatch(doc.state as BasketballMatchState);
      await persistBasketball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.BASKETBALL_BASKET,
      async (payload: {
        matchId: string;
        teamId: string;
        scorerId: string;
        points: 2 | 3;
        assistedById?: string;
      }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'basketball') return;
        const state = recordBasket(
          doc.state as BasketballMatchState,
          payload.teamId,
          payload.scorerId,
          payload.points,
          payload.assistedById
        );
        await persistBasketball(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.BASKETBALL_END_QUARTER, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'basketball') return;
      const state = endBasketballQuarter(doc.state as BasketballMatchState);
      await persistBasketball(io, matchId, state, doc.venueId);
    });

    socket.on(SOCKET_EVENTS.BASKETBALL_UNDO, async (matchId: string) => {
      if (rejectUnauthorizedScore(socket)) return;
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'basketball') return;
      const state = undoLastBasket(doc.state as BasketballMatchState);
      await persistBasketball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.BASKETBALL_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        if (rejectUnauthorizedScore(socket)) return;
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'basketball') return;
        const state = structuredClone(doc.state) as BasketballMatchState;
        state.timerSeconds = payload.timerSeconds;
        state.timerRunning = payload.timerRunning;
        if (payload.timerSeconds === 0) {
          state.timerExpired = true;
          state.timerRunning = false;
        }
        await persistBasketball(io, payload.matchId, state, doc.venueId);
      }
    );
  });
}
