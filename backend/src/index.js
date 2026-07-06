/**
 * Process entry point.
 * Validates env, connects to MongoDB, then starts the HTTP server.
 * Handles graceful shutdown and fatal error safety nets.
 */
import app from './app.js';
import env, { validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startBusinessMetricsCollector } from './config/metrics.js';
import logger from './utils/logger.js';

let server;

async function start() {
  validateEnv();

  // The DB is required in production. In development we still start the HTTP
  // server even if MongoDB is unreachable, so the API is up (health works) and
  // DB-backed routes fail gracefully instead of the whole process refusing
  // connections. This makes local `npm run dev` work without a database.
  try {
    await connectDB();
    // Start exporting business metrics to Prometheus now that the DB is up.
    startBusinessMetricsCollector();
  } catch (err) {
    if (env.isProd) throw err;
    logger.warn(`[backend] starting WITHOUT a database (development): ${err.message}`);
  }

  server = app.listen(env.port, () => {
    logger.info(`[backend] listening on port ${env.port} (env=${env.nodeEnv}, demoMode=${env.demoMode})`);
  });
}

async function shutdown(signal) {
  logger.info(`[backend] received ${signal}, shutting down...`);
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error(`[backend] unhandled rejection: ${reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`[backend] uncaught exception: ${err.message}`);
  process.exit(1);
});

start().catch((err) => {
  logger.error(`[backend] failed to start: ${err.message}`);
  process.exit(1);
});

export default app;
