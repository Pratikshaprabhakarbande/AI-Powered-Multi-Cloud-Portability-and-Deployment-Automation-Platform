/**
 * Azure Credential Validation Service.
 * Uses ClientSecretCredential to obtain a token (read-only, no resources created).
 */
import logger from '../utils/logger.js';

function friendlyError(err) {
  const msg = err.message || '';
  if (msg.includes('AADSTS7000215')) return 'Invalid Client Secret.';
  if (msg.includes('AADSTS700016')) return 'Application not found. Check the Client ID.';
  if (msg.includes('AADSTS90002')) return 'Tenant not found. Check the Tenant ID.';
  if (msg.includes('AADSTS50034')) return 'User account not found in the directory.';
  if (msg.includes('getaddrinfo') || msg.includes('ENOTFOUND')) return 'Network error: unable to reach Azure AD.';
  if (msg.includes('timeout')) return 'Connection timed out reaching Azure.';
  return `Azure error: ${msg || 'Unknown error'}`;
}

/**
 * Validate Azure credentials by obtaining a management token.
 */
export async function validateAzure({ clientId, clientSecret, tenantId }) {
  try {
    const { ClientSecretCredential } = await import('@azure/identity');
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const token = await credential.getToken('https://management.azure.com/.default');

    logger.info('[azure] credential validation successful');
    return { connected: true, tokenAcquired: true, expiresOn: token.expiresOnTimestamp };
  } catch (err) {
    const message = friendlyError(err);
    logger.warn(`[azure] credential validation failed: ${message}`);
    return { connected: false, error: message };
  }
}
