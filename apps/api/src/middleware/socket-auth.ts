import type { Server, Socket } from 'socket.io';
import { verifyToken, type AuthUser } from './auth.js';

const SCORING_ROLES = new Set(['owner', 'admin', 'competition-manager', 'scorer']);

function socketAuthOptional(): boolean {
  return (
    process.env.SOCKET_AUTH_OPTIONAL === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

export function setupSocketAuth(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      if (socketAuthOptional()) return next();
      return next(new Error('Authentication required'));
    }
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
}

export function canScoreOnSocket(socket: Socket): boolean {
  const user = socket.data.user as AuthUser | undefined;
  if (!user) return socketAuthOptional();
  return SCORING_ROLES.has(user.role);
}

export function rejectUnauthorizedScore(socket: Socket): boolean {
  if (canScoreOnSocket(socket)) return false;
  socket.emit('error', { message: 'Insufficient permissions to score' });
  return true;
}
