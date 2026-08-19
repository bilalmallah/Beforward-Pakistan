import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/config.js';
import connectDb from './config/connectDb.js';
import applyAssociations from './db/associations.js';
import { initSocket } from './realtime/socket.js';
import { startCampaignWorker } from './features/Campaign/Campaign.worker.js';
import logger from './utils/logger.js';

async function bootstrap(): Promise<void> {
  applyAssociations();
  await connectDb();

  const server = http.createServer(app);

  // Real-time events (message:new, conversation:updated, per spec section
  // 26) — per-user rooms, JWT-authenticated handshake. See realtime/socket.ts.
  const io = new Server(server, {
    cors: { origin: config.clientUrl, credentials: true },
  });
  initSocket(io);

  // Campaign send worker (spec section 37) — rate-limited via BullMQ's
  // built-in limiter (spec section 21). Requires Redis; if unreachable it
  // logs and retries rather than crashing the API (see queue/redis.ts).
  // startCampaignWorker();

  server.listen(config.port, () => {
    logger.info(`API listening on port ${config.port} [${config.env}]`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap', { err });
  process.exit(1);
});
