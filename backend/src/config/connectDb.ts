import sequelize from '../db/sequelize';
import logger from '../utils/logger';

/**
 * Fail-fast DB connection, per Teal Standard: authenticate at boot,
 * exit the process immediately if the database is unreachable rather
 * than letting the app run in a half-broken state.
 */
export default async function connectDb(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');
  } catch (err) {
    logger.error('Unable to connect to the database. Exiting.', { err });
    process.exit(1);
  }
}
