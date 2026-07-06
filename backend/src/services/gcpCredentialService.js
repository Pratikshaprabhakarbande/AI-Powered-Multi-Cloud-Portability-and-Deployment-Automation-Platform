/**
 * GCP Credential Validation Service.
 * Uses the service account JSON to obtain a token (read-only, no resources created).
 */
import logger from '../utils/logger.js';

function friendlyError(err) {
  const msg = err.message || '';
  if (msg.includes('invalid_grant')) return 'Invalid grant. The service account key may be revoked or expired.';
  if (msg.includes('invalid_client')) return 'Invalid client. Check the service account JSON format.';
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) return 'Network error: unable to reach Google APIs.';
  if (msg.includes('timeout')) return 'Connection timed out reaching Google Cloud.';
  if (msg.includes('private_key')) return 'Invalid service account JSON: missing or malformed private_key field.';
  return `GCP error: ${msg || 'Unknown error'}`;
}

/**
 * Validate GCP credentials by obtaining an access token.
 */
export async function validateGcp({ serviceAccountJson, projectId }) {
  try {
    const saJson = JSON.parse(serviceAccountJson);
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: saJson,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    logger.info(`[gcp] credential validation successful: project=${saJson.project_id}`);
    return {
      connected: true,
      projectId: projectId || saJson.project_id,
      clientEmail: saJson.client_email,
      hasToken: Boolean(tokenResponse?.token)
    };
  } catch (err) {
    const message = friendlyError(err);
    logger.warn(`[gcp] credential validation failed: ${message}`);
    return { connected: false, error: message };
  }
}
