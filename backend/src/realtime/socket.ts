import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';
import logger from '../utils/logger.js';

let io: Server | null = null;

export function initSocket(server: Server): void {
  io = server;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('No token provided.');
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug(`Socket connected: ${socket.id} (user ${userId})`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emits a real-time event to a single user's room. Safe to call before
 * the socket server is initialized (e.g. in tests) — it just no-ops.
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
