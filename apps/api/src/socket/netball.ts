import type { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@sportsync/shared';
import {
  startNetballMatch,
  recordGoal,
  undoLastGoal,
  endQuarter,
  getNetballScoreboard,
} from '@sportsync/sport-rules';
import type { NetballMatchState } from '@sportsync/shared';
import { MatchStateModel } from '../models/match-state.js';
import { completeFixtureFromMatchState } from '../services/match-completion.js';

async function persistNetball(
  io: Server,
  matchId: string,
  state: NetballMatchState,
  venueId: string
) {
  await MatchStateModel.updateOne({ matchId }, { state });
  const scoreboard = getNetballScoreboard(state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, state);
  io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCOREBOARD_UPDATE, scoreboard);
  io.to(`venue:${venueId}`).emit(SOCKET_EVENTS.VENUE_LIVE, { matchId, scoreboard, sport: 'indoor-netball' });

  if (state.status === 'completed') {
    await completeFixtureFromMatchState(matchId, 'indoor-netball', state);
  }
}

export function registerNetballHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.NETBALL_START, async (matchId: string) => {
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-netball') return;
      const state = startNetballMatch(doc.state as NetballMatchState);
      await persistNetball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.NETBALL_GOAL,
      async (payload: { matchId: string; teamId: string; scorerId: string; assistedById?: string }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-netball') return;
        const state = recordGoal(
          doc.state as NetballMatchState,
          payload.teamId,
          payload.scorerId,
          payload.assistedById
        );
        await persistNetball(io, payload.matchId, state, doc.venueId);
      }
    );

    socket.on(SOCKET_EVENTS.NETBALL_END_QUARTER, async (matchId: string) => {
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-netball') return;
      const state = endQuarter(doc.state as NetballMatchState);
      await persistNetball(io, matchId, state, doc.venueId);
    });

    socket.on(SOCKET_EVENTS.NETBALL_UNDO, async (matchId: string) => {
      const doc = await MatchStateModel.findOne({ matchId });
      if (!doc || doc.sport !== 'indoor-netball') return;
      const state = undoLastGoal(doc.state as NetballMatchState);
      await persistNetball(io, matchId, state, doc.venueId);
    });

    socket.on(
      SOCKET_EVENTS.NETBALL_TIMER,
      async (payload: { matchId: string; timerSeconds: number; timerRunning: boolean }) => {
        const doc = await MatchStateModel.findOne({ matchId: payload.matchId });
        if (!doc || doc.sport !== 'indoor-netball') return;
        const state = structuredClone(doc.state) as NetballMatchState;
        state.timerSeconds = payload.timerSeconds;
        state.timerRunning = payload.timerRunning;
        if (payload.timerSeconds === 0) {
          state.timerExpired = true;
          state.timerRunning = false;
        }
        await persistNetball(io, payload.matchId, state, doc.venueId);
      }
    );
  });
}
