import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './auth';

export function createMatchSocket(): Socket {
  const token = getAuthToken();
  return io('/', {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : {},
  });
}
