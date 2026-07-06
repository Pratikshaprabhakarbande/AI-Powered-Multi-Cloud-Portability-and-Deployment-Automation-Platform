/**
 * Profile service — enterprise profile business logic.
 * Handles 2FA, sessions, activity, presence, notifications, cloud accounts,
 * data export, and account deletion.
 */
import crypto from 'node:crypto';
import userRepository from '../repositories/UserRepository.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import tokenService from './token.service.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { User, Token, AuditLog } from '../models/index.js';
import { TOKEN_TYPES } from '../models/token.model.js';

/**
 * Dynamically import otpauth. Returns the module or throws ApiError if unavailable.
 */
async function loadOtpAuth() {
  try {
    const mod = await import('otpauth');
    return mod;
  } catch (err) {
    logger.warn(`[profile] otpauth not available: ${err.message}`);
    throw ApiError.internal('Two-factor authentication is not available. The otpauth package is not installed.');
  }
}

/**
 * Dynamically import qrcode. Returns the module or throws ApiError if unavailable.
 */
async function loadQRCode() {
  try {
    const mod = await import('qrcode');
    return mod;
  } catch (err) {
    logger.warn(`[profile] qrcode not available: ${err.message}`);
    throw ApiError.internal('QR code generation is not available. The qrcode package is not installed.');
  }
}

/**
 * Generate backup codes (10 random 8-char hex strings).
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push({ code: crypto.randomBytes(4).toString('hex'), used: false });
  }
  return codes;
}

/**
 * Update extended profile fields.
 */
async function updateExtendedProfile(userId, payload, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  const { name, organization, bio, phone, country, timezone, jobTitle } = payload;
  if (name !== undefined) user.name = name;
  if (organization !== undefined) user.organization = organization;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (country !== undefined) user.country = country;
  if (timezone !== undefined) user.timezone = timezone;
  if (jobTitle !== undefined) user.jobTitle = jobTitle;

  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Extended profile updated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Setup 2FA: generate TOTP secret, QR code, and backup codes.
 */
async function setup2FA(userId, context = {}) {
  const OTPAuth = await loadOtpAuth();
  const QRCode = await loadQRCode();

  const user = await userRepository.findByIdOrFail(userId);

  if (user.twoFactorEnabled) {
    throw ApiError.badRequest('Two-factor authentication is already enabled');
  }

  // Generate a new TOTP secret
  const secret = new OTPAuth.TOTP({
    issuer: 'CloudPortability',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret()
  });

  const otpauthUri = secret.toString();
  const qrCodeUrl = await QRCode.toDataURL(otpauthUri);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  // Store the secret (not yet enabled until verify step)
  user.twoFactorSecret = secret.secret.base32;
  user.twoFactorBackupCodes = backupCodes;
  await user.save();

  return {
    qrCodeUrl,
    secret: secret.secret.base32,
    backupCodes: backupCodes.map((bc) => bc.code)
  };
}

/**
 * Verify 2FA token and enable 2FA.
 */
async function verify2FA(userId, { token }, context = {}) {
  const OTPAuth = await loadOtpAuth();

  const user = await User.findById(userId).select('+twoFactorSecret');
  if (!user) throw ApiError.notFound('User not found');

  if (!user.twoFactorSecret) {
    throw ApiError.badRequest('Two-factor authentication has not been set up. Call setup first.');
  }

  if (user.twoFactorEnabled) {
    throw ApiError.badRequest('Two-factor authentication is already enabled');
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'CloudPortability',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
  });

  const delta = totp.validate({ token, window: 1 });
  if (delta === null) {
    throw ApiError.badRequest('Invalid verification token');
  }

  user.twoFactorEnabled = true;
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.ENABLE_2FA,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Two-factor authentication enabled',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { enabled: true };
}

/**
 * Disable 2FA after verifying current password.
 */
async function disable2FA(userId, { currentPassword }, context = {}) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (!user.twoFactorEnabled) {
    throw ApiError.badRequest('Two-factor authentication is not enabled');
  }

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.twoFactorSecret = null;
  user.twoFactorEnabled = false;
  user.twoFactorBackupCodes = [];
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.DISABLE_2FA,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Two-factor authentication disabled',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { disabled: true };
}

/**
 * Get the user's backup codes (requires password re-authentication).
 */
async function getBackupCodes(userId, { currentPassword }) {
  const user = await User.findById(userId).select('+password +twoFactorBackupCodes');
  if (!user) throw ApiError.notFound('User not found');

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  return { backupCodes: user.twoFactorBackupCodes || [] };
}

/**
 * Regenerate backup codes.
 */
async function regenerateBackupCodes(userId, context = {}) {
  const user = await User.findById(userId).select('+twoFactorBackupCodes');
  if (!user) throw ApiError.notFound('User not found');

  if (!user.twoFactorEnabled) {
    throw ApiError.badRequest('Two-factor authentication is not enabled');
  }

  const backupCodes = generateBackupCodes(10);
  user.twoFactorBackupCodes = backupCodes;
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Backup codes regenerated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { backupCodes: backupCodes.map((bc) => bc.code) };
}

/**
 * Get active sessions (non-blacklisted refresh tokens for the user).
 * Note: Cannot determine which session is "current" because the access token (JWT)
 * cannot be correlated back to a stored refresh token document.
 */
async function getActiveSessions(userId) {
  const tokens = await Token.find({
    user: userId,
    type: TOKEN_TYPES.REFRESH,
    blacklisted: false
  }).sort({ createdAt: -1 }).lean();

  return tokens.map((t) => ({
    id: t._id,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt
  }));
}

/**
 * Revoke a specific session by token ID.
 */
async function revokeSession(userId, tokenId, context = {}) {
  const result = await Token.deleteOne({
    _id: tokenId,
    user: userId,
    type: TOKEN_TYPES.REFRESH
  });

  if (result.deletedCount === 0) {
    throw ApiError.notFound('Session not found');
  }

  await auditLogRepository.record({
    actor: userId,
    action: AUDIT_ACTIONS.SESSION_REVOKED,
    entityType: 'Token',
    entityId: String(tokenId),
    description: 'Session revoked',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { revoked: true };
}

/**
 * Revoke all sessions for the user.
 * Note: Cannot exclude the "current" session because we only have the access token
 * (JWT), but the Token model stores refresh token hashes. All sessions are revoked
 * and the caller must re-authenticate.
 */
async function revokeAllOtherSessions(userId, context = {}) {
  const query = {
    user: userId,
    type: TOKEN_TYPES.REFRESH
  };

  const result = await Token.deleteMany(query);

  await auditLogRepository.record({
    actor: userId,
    action: AUDIT_ACTIONS.SESSION_REVOKED,
    entityType: 'Token',
    entityId: 'all',
    description: `Revoked all ${result.deletedCount} sessions`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { revokedCount: result.deletedCount };
}

/**
 * Get login activity from audit logs.
 */
async function getLoginActivity(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    AuditLog.find({ actor: userId, action: AUDIT_ACTIONS.LOGIN })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments({ actor: userId, action: AUDIT_ACTIONS.LOGIN })
  ]);

  return {
    entries: entries.map((e) => ({
      id: e._id,
      ip: e.ip,
      userAgent: e.userAgent,
      createdAt: e.createdAt,
      success: e.success
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get security activity from audit logs.
 */
async function getSecurityActivity(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const securityActions = [
    AUDIT_ACTIONS.LOGIN,
    AUDIT_ACTIONS.LOGOUT,
    AUDIT_ACTIONS.UPDATE,
    AUDIT_ACTIONS.CREATE,
    AUDIT_ACTIONS.DELETE,
    AUDIT_ACTIONS.ENABLE_2FA,
    AUDIT_ACTIONS.DISABLE_2FA,
    AUDIT_ACTIONS.SESSION_REVOKED
  ];

  const filter = { actor: userId, action: { $in: securityActions } };

  const [entries, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter)
  ]);

  return {
    entries: entries.map((e) => ({
      id: e._id,
      action: e.action,
      description: e.description,
      ip: e.ip,
      userAgent: e.userAgent,
      createdAt: e.createdAt,
      success: e.success
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update notification preferences.
 */
async function updateNotificationPreferences(userId, prefs, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  const currentPrefs = user.notificationPreferences || {};
  user.notificationPreferences = { ...currentPrefs, ...prefs };
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Notification preferences updated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Get connected cloud accounts.
 */
async function getConnectedAccounts(userId) {
  const user = await userRepository.findByIdOrFail(userId);
  return { accounts: user.connectedAccounts || [] };
}

/**
 * Connect a cloud account.
 */
async function connectCloudAccount(userId, { provider, accountId, region }, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  // Check if provider already exists and update, or add new
  const existingIndex = user.connectedAccounts.findIndex(
    (acc) => acc.provider === provider
  );

  if (existingIndex >= 0) {
    user.connectedAccounts[existingIndex].accountId = accountId;
    user.connectedAccounts[existingIndex].region = region;
    user.connectedAccounts[existingIndex].status = 'connected';
    user.connectedAccounts[existingIndex].connectedAt = new Date();
  } else {
    user.connectedAccounts.push({
      provider,
      accountId,
      region,
      connectedAt: new Date(),
      status: 'connected'
    });
  }

  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'CloudAccount',
    entityId: provider,
    description: `Connected ${provider} cloud account`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Disconnect a cloud account (set status to 'disconnected').
 */
async function disconnectCloudAccount(userId, provider, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  const account = user.connectedAccounts.find((acc) => acc.provider === provider);
  if (!account) {
    throw ApiError.notFound(`No connected account found for provider: ${provider}`);
  }

  account.status = 'disconnected';
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'CloudAccount',
    entityId: provider,
    description: `Disconnected ${provider} cloud account`,
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Export user profile data as JSON (excluding sensitive fields).
 */
async function exportProfileData(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');

  // Remove sensitive fields
  const { password, twoFactorSecret, twoFactorBackupCodes, __v, ...profileData } = user;

  return profileData;
}

/**
 * Delete user account (soft delete).
 */
async function deleteAccount(userId, { currentPassword }, context = {}) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Capture original email before anonymization for the audit log
  const originalEmail = user.email;

  // Revoke all tokens
  await tokenService.revokeAllUserTokens(user.id);

  // Soft delete: deactivate and anonymize email
  user.isActive = false;
  user.email = `deleted_${user.id}@deleted.local`;
  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: originalEmail,
    actorRole: user.role,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Account deleted',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { deleted: true };
}

export default {
  updateExtendedProfile,
  setup2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  getLoginActivity,
  getSecurityActivity,
  updateNotificationPreferences,
  getConnectedAccounts,
  connectCloudAccount,
  disconnectCloudAccount,
  exportProfileData,
  deleteAccount
};
