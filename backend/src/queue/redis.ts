import IORedis from 'ioredis';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * BullMQ requires this exact option — without it, ioredis will throw on
 * blocking commands used internally by the queue/worker. A single shared
 * connection is reused across the campaign queue and worker.
 */
const redisConnection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
  retryStrategy: (attempt) => Math.min(attempt * 1000, 30_000),
});

redisConnection.on('error', (err) => {
  // Logged, not thrown — Redis being unavailable shouldn't crash the whole
  // API; it just means campaign sending is paused until it's reachable.
  logger.error('[redis] connection error', { message: err.message });
});

export default redisConnection;
