/**
 * AWS Credential Validation Service.
 *
 * Uses STS GetCallerIdentity (read-only, never creates resources).
 * Explicitly provides credentials to prevent the SDK from picking up
 * stale environment variables (AWS_SESSION_TOKEN, etc.) that cause
 * "The security token included in the request is invalid."
 */
import logger from '../utils/logger.js';

/** Map AWS error codes to user-friendly messages. */
function friendlyError(err) {
  const code = err.name || err.Code || '';
  const msg = err.message || '';

  if (code === 'InvalidClientTokenId' || msg.includes('security token'))
    return 'Invalid Access Key ID. Please check the key is correct and active.';
  if (code === 'SignatureDoesNotMatch')
    return 'Invalid Secret Access Key. The signature does not match.';
  if (code === 'ExpiredToken' || code === 'ExpiredTokenException')
    return 'The security token has expired. Use permanent credentials (not temporary session tokens).';
  if (code === 'AccessDenied' || code === 'AccessDeniedException')
    return 'Access denied. The IAM user/role may lack the sts:GetCallerIdentity permission.';
  if (code === 'InvalidIdentityToken')
    return 'The security token included in the request is invalid. Ensure you are using permanent IAM credentials (Access Key + Secret Key), not temporary session tokens.';
  if (msg.includes('getaddrinfo') || msg.includes('ENOTFOUND'))
    return 'Network error: unable to reach AWS. Check your internet connection and region.';
  if (msg.includes('timeout') || msg.includes('ETIMEDOUT'))
    return 'Connection timed out. AWS may be unreachable from your network.';
  if (code === 'UnrecognizedClientException')
    return 'Unrecognized client. The Access Key ID may be malformed or deactivated.';

  return `AWS error: ${msg || code || 'Unknown error'}`;
}

/**
 * Validate AWS credentials using STS GetCallerIdentity.
 * @param {{ accessKeyId: string, secretAccessKey: string, region: string }} creds
 * @returns {Promise<{ connected: boolean, accountId?: string, arn?: string, userId?: string, error?: string }>}
 */
export async function validateAws({ accessKeyId, secretAccessKey, region }) {
  try {
    const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');

    // CRITICAL: Provide credentials explicitly and do NOT use the default
    // credential provider chain. This prevents the SDK from reading
    // AWS_SESSION_TOKEN or other stale env vars that cause "invalid token" errors.
    const client = new STSClient({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
        // Intentionally NO sessionToken — we only support permanent IAM credentials.
      },
      // Disable the default credential provider chain entirely.
      credentialDefaultProvider: undefined
    });

    const result = await client.send(new GetCallerIdentityCommand({}));

    logger.info(`[aws] credential validation successful: account=${result.Account}`);
    return {
      connected: true,
      accountId: result.Account,
      arn: result.Arn,
      userId: result.UserId
    };
  } catch (err) {
    const message = friendlyError(err);
    logger.warn(`[aws] credential validation failed: ${message}`);
    return { connected: false, error: message };
  }
}
