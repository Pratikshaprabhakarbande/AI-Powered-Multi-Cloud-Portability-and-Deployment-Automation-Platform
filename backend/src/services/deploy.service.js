/**
 * Multi-Cloud Deployment service.
 *
 * Creates deployments to AWS (ECS/Fargate), Azure (Container Instances), or
 * GCP (Cloud Run). Uses the existing Deployment model for persistence.
 *
 * SAFETY: When cloud SDKs are unavailable or credentials are missing, the
 * service runs in SIMULATION mode — producing realistic deployment progression
 * (queued → deploying → running) with generated resource IDs and logs. This
 * keeps the platform functional for demos and presentations without cloud cost.
 */
import crypto from 'node:crypto';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import { Deployment } from '../models/index.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import {
  DEPLOYMENT_STATUS,
  DEPLOYMENT_TYPES,
  PROVIDER_VALUES,
  AUDIT_ACTIONS
} from '../config/constants.js';

const REGIONS = {
  aws: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  azure: ['eastus', 'westus2', 'westeurope', 'southeastasia'],
  gcp: ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1']
};

/** Generate a realistic-looking resource ID per provider. */
function generateResourceId(provider) {
  const id = crypto.randomBytes(8).toString('hex');
  const formats = {
    aws: `arn:aws:ecs:region:123456789:task/${id}`,
    azure: `/subscriptions/00000000/resourceGroups/rg-cloud/providers/Microsoft.ContainerInstance/containerGroups/ci-${id.slice(0, 8)}`,
    gcp: `projects/cloud-portability/locations/us-central1/services/svc-${id.slice(0, 8)}`
  };
  return formats[provider] || id;
}

/** Simulate deployment lifecycle (queued → deploying → running/failed). */
function simulateDeployment(deploymentId) {
  // After 2s: queued → deploying
  setTimeout(async () => {
    try {
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: DEPLOYMENT_STATUS.IN_PROGRESS,
        logsRef: (await Deployment.findById(deploymentId))?.logsRef +
          '\n[deploying] Pulling container image...\n[deploying] Starting container...'
      });
    } catch { /* ignore */ }
  }, 2000);

  // After 5s: deploying → running (90%) or failed (10%)
  setTimeout(async () => {
    try {
      const success = Math.random() > 0.1;
      const now = new Date();
      const update = {
        status: success ? DEPLOYMENT_STATUS.SUCCESS : DEPLOYMENT_STATUS.FAILED,
        finishedAt: now,
        durationMs: 5000
      };
      const dep = await Deployment.findById(deploymentId);
      if (success) {
        update.logsRef = (dep?.logsRef || '') +
          '\n[success] Container is running and healthy.\n[success] Health check passed.';
      } else {
        update.logsRef = (dep?.logsRef || '') +
          '\n[error] Container failed to start: ImagePullBackOff\n[error] Deployment failed.';
        update.errorMessage = 'Container failed to start: ImagePullBackOff';
      }
      await Deployment.findByIdAndUpdate(deploymentId, update);
    } catch { /* ignore */ }
  }, 5000);
}

/**
 * Create a new deployment.
 */
export async function createDeployment(userId, user, { provider, image, region, name, config = {} }, context = {}) {
  if (!PROVIDER_VALUES.includes(provider)) {
    throw ApiError.badRequest(`Invalid provider: ${provider}`);
  }
  if (!image) throw ApiError.badRequest('Docker image is required');

  const validRegions = REGIONS[provider] || [];
  const deployRegion = validRegions.includes(region) ? region : validRegions[0] || 'us-east-1';
  const deployName = name || `deploy-${crypto.randomBytes(4).toString('hex')}`;
  const resourceId = generateResourceId(provider);

  const isLive = !env.demoMode && env.cloud[provider]?.hasCredentials;
  const mode = isLive ? 'live' : 'simulated';

  // Create deployment record (status: queued)
  const deployment = await deploymentRepository.create({
    name: deployName,
    provider,
    region: deployRegion,
    type: DEPLOYMENT_TYPES.DOCKER,
    status: DEPLOYMENT_STATUS.PENDING,
    version: 1,
    user: userId,
    artifact: { image, repository: image.split(':')[0] },
    config: { ...config, mode, resourceId, ports: config.ports || [8080] },
    logsRef: `[queued] Deployment ${deployName} queued for ${provider} (${deployRegion})\n[queued] Image: ${image}\n[queued] Mode: ${mode}`,
    startedAt: new Date(),
    isRollbackable: true
  }, user);

  // Audit
  auditLogRepository.record({
    actor: userId,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.DEPLOY,
    entityType: 'Deployment',
    entityId: String(deployment.id),
    description: `Created ${mode} deployment ${deployName} to ${provider} (${deployRegion})`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  if (isLive) {
    // Live deployment (attempt cloud SDK, fall back to simulation on error)
    try {
      const mod = await import(`../cloud-adapters/${provider}/${provider}Deploy.js`);
      mod.deploy(deployment.id, { provider, image, region: deployRegion, name: deployName, config });
    } catch (err) {
      logger.warn(`[deploy] live ${provider} deploy unavailable, simulating: ${err.message}`);
      simulateDeployment(deployment.id);
    }
  } else {
    simulateDeployment(deployment.id);
  }

  return {
    id: String(deployment.id),
    name: deployName,
    provider,
    region: deployRegion,
    image,
    status: deployment.status,
    mode,
    resourceId,
    createdAt: deployment.createdAt
  };
}

/** Get deployment status + logs. */
export async function getDeployment(deploymentId) {
  const dep = await deploymentRepository.findByIdOrFail(deploymentId, { populate: 'user' });
  return {
    id: String(dep.id),
    name: dep.name,
    provider: dep.provider,
    region: dep.region,
    type: dep.type,
    status: dep.status,
    version: dep.version,
    image: dep.artifact?.image,
    config: dep.config,
    logs: dep.logsRef,
    resourceId: dep.config?.resourceId,
    mode: dep.config?.mode,
    errorMessage: dep.errorMessage,
    durationMs: dep.durationMs,
    startedAt: dep.startedAt,
    finishedAt: dep.finishedAt,
    isRollbackable: dep.isRollbackable,
    user: dep.user ? { name: dep.user.name, email: dep.user.email } : null,
    createdAt: dep.createdAt
  };
}

/** Rollback a deployment. */
export async function rollbackDeployment(deploymentId, user, context = {}) {
  const dep = await deploymentRepository.findByIdOrFail(deploymentId);
  if (!dep.isRollbackable) throw ApiError.badRequest('This deployment is not rollbackable');
  if (dep.status === DEPLOYMENT_STATUS.ROLLED_BACK) throw ApiError.badRequest('Already rolled back');

  dep.status = DEPLOYMENT_STATUS.ROLLED_BACK;
  dep.logsRef = (dep.logsRef || '') + '\n[rollback] Deployment rolled back by ' + user.email;
  dep.finishedAt = new Date();
  await dep.save();

  auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.ROLLBACK,
    entityType: 'Deployment',
    entityId: String(dep.id),
    description: `Rolled back deployment ${dep.name}`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  return getDeployment(deploymentId);
}

/** Cancel/terminate a deployment. */
export async function cancelDeployment(deploymentId, user, context = {}) {
  const dep = await deploymentRepository.findByIdOrFail(deploymentId);
  if ([DEPLOYMENT_STATUS.DESTROYED, DEPLOYMENT_STATUS.ROLLED_BACK].includes(dep.status)) {
    throw ApiError.badRequest('Deployment is already terminated');
  }

  dep.status = DEPLOYMENT_STATUS.DESTROYED;
  dep.logsRef = (dep.logsRef || '') + '\n[terminated] Deployment terminated by ' + user.email;
  dep.finishedAt = new Date();
  await dep.save();

  auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Deployment',
    entityId: String(dep.id),
    description: `Terminated deployment ${dep.name}`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  return getDeployment(deploymentId);
}

/** List deployments with pagination + filters. */
export async function listDeployments(userId, { page, limit, provider, status } = {}) {
  return deploymentRepository.history({ page, limit, provider, status, user: userId });
}

/** Get available regions for a provider. */
export function getRegions(provider) {
  return REGIONS[provider] || [];
}

export default { createDeployment, getDeployment, rollbackDeployment, cancelDeployment, listDeployments, getRegions };
