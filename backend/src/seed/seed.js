/**
 * Database seeder.
 *
 * Usage:
 *   npm run seed            # insert demo data (skips if users already exist)
 *   npm run seed -- --fresh # wipe known collections, then insert
 *
 * Safe by design: refuses to run with --fresh against a production NODE_ENV.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load .env from the backend root (same logic as env.js).
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
import { connectDB, disconnectDB } from '../config/db.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import { ROLES } from '../config/constants.js';
import {
  User,
  Deployment,
  CloudResource,
  SecurityReport,
  ComplianceReport,
  PortabilityReport,
  MigrationReport,
  IncidentReport,
  CostReport,
  AIRecommendation,
  Notification
} from '../models/index.js';
import * as data from './sampleData.js';

const FRESH = process.argv.includes('--fresh');

async function wipe() {
  if (env.isProd) throw new Error('Refusing to run --fresh in production');
  logger.warn('[seed] wiping demo collections...');
  await Promise.all([
    User.deleteMany({}),
    Deployment.deleteMany({}, { withDeleted: true }),
    CloudResource.deleteMany({}, { withDeleted: true }),
    SecurityReport.deleteMany({}, { withDeleted: true }),
    ComplianceReport.deleteMany({}, { withDeleted: true }),
    PortabilityReport.deleteMany({}, { withDeleted: true }),
    MigrationReport.deleteMany({}, { withDeleted: true }),
    IncidentReport.deleteMany({}, { withDeleted: true }),
    CostReport.deleteMany({}, { withDeleted: true }),
    AIRecommendation.deleteMany({}, { withDeleted: true }),
    Notification.deleteMany({}, { withDeleted: true })
  ]);
}

async function run() {
  await connectDB();

  if (FRESH) await wipe();

  const existing = await User.countDocuments();
  if (existing > 0 && !FRESH) {
    logger.info(`[seed] ${existing} users already exist — skipping (use --fresh to reseed)`);
    return;
  }

  // Users (passwords hashed by the model pre-save hook). create() runs hooks.
  const createdUsers = [];
  for (const u of data.users) {
    // eslint-disable-next-line no-await-in-loop
    createdUsers.push(await User.create(u));
  }
  const usersByRole = createdUsers.reduce((acc, u) => ({ ...acc, [u.role]: u }), {});
  const admin = usersByRole[ROLES.ADMIN];
  logger.info(`[seed] created ${createdUsers.length} users`);

  await Deployment.create(data.buildDeployments(usersByRole));
  await CloudResource.create(data.buildCloudResources());
  await SecurityReport.create(data.buildSecurityReports(admin));
  await ComplianceReport.create(data.buildComplianceReports(admin));
  await PortabilityReport.create(data.buildPortabilityReports(admin));
  await MigrationReport.create(data.buildMigrationReports(admin));
  await IncidentReport.create(data.buildIncidentReports(admin));
  await CostReport.create(data.buildCostReports(admin));
  await AIRecommendation.create(data.buildAIRecommendations(admin));
  await Notification.create(data.buildNotifications(admin));

  logger.info('[seed] demo data inserted successfully');
  logger.info('[seed] login with: admin@demo.io / Admin@12345');
}

run()
  .catch((err) => {
    logger.error(`[seed] failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
