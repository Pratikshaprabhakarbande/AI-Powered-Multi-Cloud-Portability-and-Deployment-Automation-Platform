/**
 * MongoDB connection layer (Mongoose).
 *
 * - Single shared connection with sensible pool/timeout options.
 * - Retry with backoff on initial connect.
 * - Connection event logging.
 * - Graceful disconnect helper for clean shutdown and tests.
 */
import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

let isConnected = false;

/**
 * Connect to MongoDB with retry/backoff.
 * @param {object} [opts]
 * @param {number} [opts.retries=5]
 * @param {number} [opts.delayMs=2000]
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB({ retries = 5, delayMs = 2000 } = {}) {
  if (isConnected) return mongoose;

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('[db] MongoDB connected');
  });
  mongoose.connection.on('error', (err) => logger.error(`[db] connection error: ${err.message}`));
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('[db] MongoDB disconnected');
  });

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      attempt += 1;
      await mongoose.connect(env.db.uri, env.db.options);
      return mongoose;
    } catch (err) {
      if (attempt >= retries) {
        logger.error(`[db] failed to connect after ${retries} attempts: ${err.message}`);
        throw err;
      }
      const wait = delayMs * attempt;
      logger.warn(`[db] connect attempt ${attempt} failed, retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** Gracefully close the connection (used on shutdown / in tests). */
export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  logger.info('[db] MongoDB connection closed');
}

export function getConnectionState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState;
}

export default { connectDB, disconnectDB, getConnectionState };
