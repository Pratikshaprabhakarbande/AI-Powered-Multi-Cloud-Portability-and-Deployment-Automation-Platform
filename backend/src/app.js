/**
 * Express application assembly.
 * Wires security middleware, request logging, the API router, and the
 * centralized error handling pipeline.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { metricsMiddleware, metricsHandler } from './config/metrics.js';
import { apiLimiter } from './middleware/rateLimit.js';
import csrfProtection from './middleware/csrf.js';
import { notFound, errorConverter, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust the first proxy (needed for correct req.ip behind load balancers).
app.set('trust proxy', 1);

// Security & parsing middleware
app.use(helmet());
// Only enable credentials when the origin is explicit (never with a wildcard).
const allowCredentials = env.corsOrigin !== '*';
app.use(cors({ origin: env.corsOrigin, credentials: allowCredentials }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request metrics (records count, duration, errors for every request)
app.use(metricsMiddleware);

// Request logging -> winston
app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) }
  })
);

// Prometheus scrape endpoint (unauthenticated, not rate-limited, outside /api)
app.get('/metrics', metricsHandler);

// Liveness probe (also available at /api/health)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: { demoMode: env.demoMode, timestamp: new Date().toISOString() }
  });
});

// Global API rate limit + CSRF (no-op unless cookie auth enabled) + routes
app.use(env.apiPrefix, apiLimiter, csrfProtection, routes);

// 404 + error handling (order matters: convert before final handler)
app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;
