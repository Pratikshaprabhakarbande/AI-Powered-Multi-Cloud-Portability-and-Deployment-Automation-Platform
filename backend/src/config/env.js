/**
 * Centralized, validated environment configuration.
 *
 * Reads from process.env (populated by dotenv) and exposes a typed,
 * frozen config object. Fails fast in production if required secrets are missing.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load .env from the backend root directory (where package.json lives),
// regardless of the current working directory when Node is started.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  // Only warn in non-production (production uses injected env vars, no .env file)
  if (process.env.NODE_ENV !== 'production') {
    process.stderr.write(`[env] warning: ${envPath} not found (using environment variables)\n`);
  }
}

const toBool = (v, fallback = false) =>
  v === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api',
  // Default to the local dev frontend origin (never wildcard with credentials).
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  demoMode: toBool(process.env.DEMO_MODE, true),

  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/cloudportability',
    // Mongoose connection options
    options: {
      serverSelectionTimeoutMS: toInt(process.env.MONGO_TIMEOUT_MS, 10000),
      maxPoolSize: toInt(process.env.MONGO_POOL_SIZE, 10),
      autoIndex: (process.env.NODE_ENV || 'development') !== 'production'
    }
  },

  jwt: {
    // Required from the environment — no insecure fallback. validateEnv() fails
    // fast if these are missing.
    secret: process.env.JWT_SECRET,
    // Access token should be short-lived; refresh token longer-lived & revocable.
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    // Password reset token lifetime (minutes)
    resetExpiresInMin: toInt(process.env.JWT_RESET_EXPIRES_MIN, 15)
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100)
  },

  // In-memory cache for cloud provider adapter results (Redis-backed when REDIS_URL set).
  cache: {
    enabled: toBool(process.env.CACHE_ENABLED, (process.env.NODE_ENV || 'development') !== 'test'),
    ttlMs: toInt(process.env.CACHE_TTL_MS, 30000),
    redisUrl: process.env.REDIS_URL || null
  },

  // Opt-in HttpOnly-cookie refresh-token strategy + CSRF (default OFF for
  // backward compatibility with the Bearer-token flow).
  auth: {
    cookieRefresh: toBool(process.env.AUTH_COOKIE_REFRESH, false),
    cookieSecure: toBool(process.env.COOKIE_SECURE, (process.env.NODE_ENV || 'development') === 'production'),
    cookieSameSite: process.env.COOKIE_SAMESITE || 'strict'
  },

  // Terraform automation engine. Safe by default: when disabled (the default),
  // commands are SIMULATED — no terraform binary, no cloud calls, no billable
  // resources. Enable explicitly to run the real terraform CLI.
  terraform: {
    enabled: toBool(process.env.TERRAFORM_ENABLED, false),
    bin: process.env.TERRAFORM_BIN || 'terraform',
    // Root of the IaC templates (defaults to the repo's infra/terraform).
    rootDir: process.env.TERRAFORM_ROOT || '../infra/terraform',
    // Apply/destroy require this extra guard even when terraform is enabled.
    allowMutations: toBool(process.env.TERRAFORM_ALLOW_MUTATIONS, false)
  },

  // AI Cloud Advisor. Defaults to the rule-based engine (zero-cost, offline).
  // Bedrock is opt-in and only used when explicitly enabled + credentialed.
  ai: {
    provider: process.env.AI_PROVIDER || 'rule', // 'rule' | 'bedrock'
    bedrockEnabled: toBool(process.env.BEDROCK_ENABLED, false),
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0'
  },

  // Live cloud integrations. Adapters serve demo/DB data UNLESS DEMO_MODE=false
  // AND the provider's credentials are present. SDKs are loaded lazily
  // (optional deps) and any failure falls back to demo data — so the app never
  // crashes and incurs no cost by default.
  cloud: {
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    },
    azure: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || null,
      hasCredentials: Boolean(
        process.env.AZURE_SUBSCRIPTION_ID &&
          process.env.AZURE_TENANT_ID &&
          process.env.AZURE_CLIENT_ID &&
          process.env.AZURE_CLIENT_SECRET
      )
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID || null,
      hasCredentials: Boolean(process.env.GCP_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS)
    }
  },

  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate critical configuration and FAIL FAST.
 *
 * - JWT secrets are required in every environment (no insecure fallback).
 * - In production, MONGO_URI must be set and CORS_ORIGIN must be an explicit,
 *   non-wildcard origin (credentials are enabled).
 */
export function validateEnv() {
  const problems = [];

  // Always required — there is no safe default for signing secrets.
  if (!env.jwt.secret) {
    problems.push('JWT_SECRET is required (set it in the environment / .env)');
  }
  if (!env.jwt.refreshSecret) {
    problems.push('JWT_REFRESH_SECRET is required (set it in the environment / .env)');
  }
  if (env.jwt.secret && env.jwt.secret === env.jwt.refreshSecret) {
    problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }

  if (env.isProd) {
    if (!process.env.MONGO_URI) {
      problems.push('MONGO_URI must be set in production');
    }
    if (!process.env.CORS_ORIGIN || env.corsOrigin === '*') {
      problems.push('CORS_ORIGIN must be set to an explicit (non-wildcard) origin in production');
    }
  }

  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }
  return env;
}

export default Object.freeze(env);
