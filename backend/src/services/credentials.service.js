/**
 * Cloud Credentials service.
 * Encrypts credentials before storing, never exposes raw secrets in responses.
 * Provides connection testing per provider.
 */
import crypto from 'node:crypto';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(env.jwt.secret || 'fallback-key', 'cloud-creds-salt', 32);

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(encoded) {
  if (!encoded) return null;
  try {
    const [ivHex, tagHex, data] = encoded.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/** Get credential status (connected/not) without exposing secrets. */
export async function getStatus(userId) {
  const user = await User.findById(userId).select('+cloudCredentials').lean();
  const creds = user?.cloudCredentials || {};
  return {
    aws: { connected: Boolean(creds.aws?.accessKeyId && creds.aws?.secretAccessKey), region: creds.aws?.region || 'us-east-1' },
    azure: { connected: Boolean(creds.azure?.clientId && creds.azure?.clientSecret && creds.azure?.tenantId), region: creds.azure?.region || 'eastus' },
    gcp: { connected: Boolean(creds.gcp?.serviceAccountJson), projectId: creds.gcp?.projectId || null }
  };
}

/** Save encrypted credentials for a provider. */
export async function saveCredentials(userId, provider, credentials) {
  const user = await User.findById(userId).select('+cloudCredentials');
  if (!user) throw ApiError.notFound('User not found');

  if (!user.cloudCredentials) user.cloudCredentials = {};

  if (provider === 'aws') {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw ApiError.badRequest('AWS Access Key ID and Secret Access Key are required');
    }
    user.cloudCredentials.aws = {
      accessKeyId: encrypt(credentials.accessKeyId),
      secretAccessKey: encrypt(credentials.secretAccessKey),
      region: credentials.region || 'us-east-1'
    };
  } else if (provider === 'azure') {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.tenantId) {
      throw ApiError.badRequest('Azure Client ID, Secret, and Tenant ID are required');
    }
    user.cloudCredentials.azure = {
      clientId: encrypt(credentials.clientId),
      clientSecret: encrypt(credentials.clientSecret),
      tenantId: encrypt(credentials.tenantId),
      subscriptionId: encrypt(credentials.subscriptionId || ''),
      region: credentials.region || 'eastus'
    };
  } else if (provider === 'gcp') {
    if (!credentials.serviceAccountJson) {
      throw ApiError.badRequest('GCP Service Account JSON is required');
    }
    // Validate it's parseable JSON
    try { JSON.parse(credentials.serviceAccountJson); } catch {
      throw ApiError.badRequest('Service Account JSON is not valid JSON');
    }
    user.cloudCredentials.gcp = {
      serviceAccountJson: encrypt(credentials.serviceAccountJson),
      projectId: credentials.projectId || JSON.parse(credentials.serviceAccountJson).project_id || ''
    };
  } else {
    throw ApiError.badRequest('Invalid provider');
  }

  user.markModified('cloudCredentials');
  await user.save();
  logger.info(`[credentials] ${provider} credentials saved for user ${userId}`);
  return getStatus(userId);
}

/** Remove credentials for a provider. */
export async function removeCredentials(userId, provider) {
  const user = await User.findById(userId).select('+cloudCredentials');
  if (!user) throw ApiError.notFound('User not found');
  if (user.cloudCredentials) {
    user.cloudCredentials[provider] = undefined;
    user.markModified('cloudCredentials');
    await user.save();
  }
  return getStatus(userId);
}

/** Test connection for a provider (attempts a simple read-only API call). */
export async function testConnection(userId, provider) {
  const user = await User.findById(userId).select('+cloudCredentials').lean();
  const creds = user?.cloudCredentials?.[provider];
  if (!creds) throw ApiError.badRequest(`No ${provider} credentials configured`);

  try {
    if (provider === 'aws') {
      const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
      const client = new STSClient({
        region: creds.region || 'us-east-1',
        credentials: {
          accessKeyId: decrypt(creds.accessKeyId),
          secretAccessKey: decrypt(creds.secretAccessKey)
        }
      });
      const result = await client.send(new GetCallerIdentityCommand({}));
      return { connected: true, accountId: result.Account, arn: result.Arn };
    } else if (provider === 'azure') {
      const { ClientSecretCredential } = await import('@azure/identity');
      const cred = new ClientSecretCredential(
        decrypt(creds.tenantId), decrypt(creds.clientId), decrypt(creds.clientSecret)
      );
      const token = await cred.getToken('https://management.azure.com/.default');
      return { connected: true, tokenExpiry: token.expiresOnTimestamp };
    } else if (provider === 'gcp') {
      const { GoogleAuth } = await import('google-auth-library');
      const saJson = JSON.parse(decrypt(creds.serviceAccountJson));
      const auth = new GoogleAuth({ credentials: saJson, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      return { connected: true, projectId: saJson.project_id, hasToken: Boolean(token) };
    }
    throw ApiError.badRequest('Invalid provider');
  } catch (err) {
    if (err.statusCode) throw err;
    logger.warn(`[credentials] ${provider} test failed: ${err.message}`);
    return { connected: false, error: err.message };
  }
}

export default { getStatus, saveCredentials, removeCredentials, testConnection };
