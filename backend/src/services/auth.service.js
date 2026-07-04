/**
 * Authentication service — business logic for register/login/profile/reset.
 * Talks to repositories and the token service; throws ApiError on failures.
 */
import userRepository from '../repositories/UserRepository.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import tokenService from './token.service.js';
import { sendResetEmail } from './email.service.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';

/**
 * Register a new user.
 * Security: self-registration cannot grant the Admin role. Only an existing
 * Admin can create Admins (handled by a separate admin user-management flow).
 */
async function register({ name, email, password, role, organization }, context = {}) {
  if (await userRepository.emailExists(email)) {
    throw ApiError.conflict('Email is already registered');
  }

  let assignedRole = role || ROLES.VIEWER;
  if (assignedRole === ROLES.ADMIN) {
    // Prevent privilege escalation via public registration.
    assignedRole = ROLES.VIEWER;
  }

  const user = await userRepository.create({
    name,
    email,
    password,
    role: assignedRole,
    organization
  });

  const tokens = await tokenService.generateAuthTokens(user);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'User registered',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { user: user.toJSON(), tokens };
}

/** Authenticate with email + password. */
async function login({ email, password }, context = {}) {
  const user = await userRepository.findByEmail(email, { withPassword: true });

  // Uniform error to avoid user enumeration.
  const invalid = ApiError.unauthorized('Invalid email or password');
  if (!user) throw invalid;
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  const match = await user.comparePassword(password);
  if (!match) {
    await auditLogRepository.record({
      actorEmail: email,
      action: AUDIT_ACTIONS.LOGIN,
      description: 'Failed login',
      success: false,
      ip: context.ip,
      userAgent: context.userAgent
    });
    throw invalid;
  }

  await userRepository.recordLogin(user.id);
  const tokens = await tokenService.generateAuthTokens(user);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.LOGIN,
    description: 'User logged in',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { user: user.toJSON(), tokens };
}

/** Logout: revoke the supplied refresh token (if any). */
async function logout(refreshToken, context = {}) {
  await tokenService.revokeRefreshToken(refreshToken);
  await auditLogRepository.record({
    actor: context.userId,
    action: AUDIT_ACTIONS.LOGOUT,
    description: 'User logged out',
    ip: context.ip,
    userAgent: context.userAgent
  });
}

/** Exchange a valid refresh token for a new access+refresh pair (rotation). */
async function refreshTokens(refreshToken) {
  const { userId } = await tokenService.rotateRefreshToken(refreshToken);
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');
  const tokens = await tokenService.generateAuthTokens(user);
  return { tokens };
}

/** Get the current user's profile. */
async function getProfile(userId) {
  const user = await userRepository.findByIdOrFail(userId);
  return user.toJSON();
}

/** Update profile fields and optionally change password. */
async function updateProfile(userId, payload, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  const { name, organization, avatarUrl, preferences, currentPassword, newPassword } = payload;
  if (name !== undefined) user.name = name;
  if (organization !== undefined) user.organization = organization;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (preferences) user.preferences = { ...user.preferences.toObject?.() ?? user.preferences, ...preferences };

  // Optional password change requires current password verification.
  if (newPassword) {
    if (!currentPassword) throw ApiError.badRequest('currentPassword is required to change password');
    const match = await userRepository.findByEmail(user.email, { withPassword: true })
      .then((u) => u.comparePassword(currentPassword));
    if (!match) throw ApiError.badRequest('Current password is incorrect');
    user.password = newPassword; // re-hashed by pre-save hook
    // Invalidate existing sessions after a password change.
    await tokenService.revokeAllUserTokens(user.id);
  }

  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Profile updated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Begin password reset. Always resolves with a generic result to avoid leaking
 * which emails exist. In non-production, returns the raw token for demo/testing.
 */
async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { delivered: false }; // do not reveal non-existence
  }
  const rawToken = await tokenService.generateResetToken(user);

  // Send via SMTP when configured; fallback logs the token (demo mode).
  const sent = await sendResetEmail({ to: user.email, resetToken: rawToken });

  logger.info(`[auth] password reset for ${email}: sent=${sent}`);
  return { delivered: true, resetToken: env.isProd ? undefined : rawToken };
}

/** Complete password reset with a one-time token. */
async function resetPassword({ token, password }) {
  const userId = await tokenService.consumeResetToken(token);
  const user = await userRepository.findByIdOrFail(userId);
  user.password = password; // re-hashed by pre-save hook
  await user.save();
  await tokenService.revokeAllUserTokens(user.id); // invalidate sessions
  return { reset: true };
}

/**
 * Change email with current password verification.
 * Revokes all tokens after email change for security.
 */
async function changeEmail(userId, { email, currentPassword }, context = {}) {
  const user = await userRepository.findByEmail(
    (await userRepository.findByIdOrFail(userId)).email,
    { withPassword: true }
  );

  if (!currentPassword) throw ApiError.badRequest('currentPassword is required');

  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.badRequest('Current password is incorrect');

  if (await userRepository.emailExists(email, userId)) {
    throw ApiError.conflict('Email is already in use');
  }

  user.email = email;
  user.emailVerified = false;
  await user.save();

  // Invalidate existing sessions after email change.
  await tokenService.revokeAllUserTokens(user.id);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Email changed',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Dedicated password change with current password verification.
 * Revokes all tokens after password change for security.
 */
async function changePassword(userId, { currentPassword, newPassword }, context = {}) {
  const user = await userRepository.findByEmail(
    (await userRepository.findByIdOrFail(userId)).email,
    { withPassword: true }
  );

  if (!currentPassword) throw ApiError.badRequest('currentPassword is required');

  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword; // re-hashed by pre-save hook
  await user.save();

  // Invalidate existing sessions after password change.
  await tokenService.revokeAllUserTokens(user.id);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Password changed',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Upload avatar as base64 data URL.
 * Validates the data URL format and size before storing.
 *
 * NOTE: Avatars are stored as base64 data URLs directly in the User document.
 * This means every user.toJSON() response includes the full avatar payload (up
 * to ~7 MB). This is a known trade-off chosen because the project does not use
 * multer or external file storage. If response size becomes a concern, consider
 * migrating to GridFS or object storage and serving avatars via a dedicated URL.
 */
async function uploadAvatar(userId, base64Data, context = {}) {
  // Validate data URL format
  const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!dataUrlPattern.test(base64Data)) {
    throw ApiError.badRequest('Avatar must be a base64 data URL with format: data:image/(jpeg|jpg|png|webp);base64,...');
  }

  // Validate size (5MB image = ~6.67MB base64 string)
  const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // ~7MB chars allows for ~5MB image
  if (base64Data.length > MAX_BASE64_LENGTH) {
    throw ApiError.badRequest('Avatar image exceeds maximum size of 5MB');
  }

  const user = await userRepository.updateAvatar(userId, base64Data);
  if (!user) throw ApiError.notFound('User not found');

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Avatar updated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

export default {
  register,
  login,
  logout,
  refreshTokens,
  getProfile,
  updateProfile,
  changeEmail,
  changePassword,
  uploadAvatar,
  forgotPassword,
  resetPassword
};
