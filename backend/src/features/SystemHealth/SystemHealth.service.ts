import sequelize from '../../db/sequelize';
import redisConnection from '../../queue/redis';

export type ComponentStatus = 'UP' | 'DOWN';

export interface SystemHealthReport {
  api: ComponentStatus;
  database: ComponentStatus;
  redis: ComponentStatus;
  checkedAt: string;
}

/**
 * Live-checks each infrastructure dependency rather than assuming — the
 * point of a status page is telling the truth when something's down, not
 * reporting green because the process is running (spec section 60).
 */
export async function getSystemHealth(): Promise<SystemHealthReport> {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  return {
    api: 'UP', // if this code is executing, the API process itself is up
    database,
    redis,
    checkedAt: new Date().toISOString(),
  };
}

async function checkDatabase(): Promise<ComponentStatus> {
  try {
    await sequelize.authenticate();
    return 'UP';
  } catch {
    return 'DOWN';
  }
}

async function checkRedis(): Promise<ComponentStatus> {
  try {
    const pong = await redisConnection.ping();
    return pong === 'PONG' ? 'UP' : 'DOWN';
  } catch {
    return 'DOWN';
  }
}
