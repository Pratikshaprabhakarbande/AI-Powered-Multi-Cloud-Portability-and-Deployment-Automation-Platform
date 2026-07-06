/**
 * Profile controller — thin HTTP layer over profile.service.
 * Handles enterprise profile operations: 2FA, sessions, activity,
 * notifications, cloud accounts, export, and account deletion.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import profileService from '../services/profile.service.js';

const reqContext = (req) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  userId: req.user?.id
});

export const updateExtendedProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateExtendedProfile(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const setup2FA = asyncHandler(async (req, res) => {
  const result = await profileService.setup2FA(req.user.id, reqContext(req));
  return sendSuccess(res, { message: 'Two-factor authentication setup initiated', data: result });
});

export const verify2FA = asyncHandler(async (req, res) => {
  const result = await profileService.verify2FA(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Two-factor authentication enabled', data: result });
});

export const disable2FA = asyncHandler(async (req, res) => {
  const result = await profileService.disable2FA(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Two-factor authentication disabled', data: result });
});

export const getBackupCodes = asyncHandler(async (req, res) => {
  const result = await profileService.getBackupCodes(req.user.id, req.body);
  return sendSuccess(res, { message: 'Backup codes retrieved', data: result });
});

export const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const result = await profileService.regenerateBackupCodes(req.user.id, reqContext(req));
  return sendSuccess(res, { message: 'Backup codes regenerated', data: result });
});

export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await profileService.getActiveSessions(req.user.id);
  return sendSuccess(res, { message: 'Active sessions retrieved', data: { sessions } });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const result = await profileService.revokeSession(req.user.id, req.params.id, reqContext(req));
  return sendSuccess(res, { message: 'Session revoked', data: result });
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  // Note: We cannot identify the "current" session because the Token model stores
  // refresh token hashes, but we only have the access token (JWT) here. Revoking all
  // sessions means the caller will also be logged out and must re-authenticate.
  const result = await profileService.revokeAllOtherSessions(
    req.user.id,
    reqContext(req)
  );
  return sendSuccess(res, {
    message: 'All sessions revoked. Please log in again.',
    data: result
  });
});

export const getLoginActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await profileService.getLoginActivity(req.user.id, { page, limit });
  return sendSuccess(res, { message: 'Login activity retrieved', data: result });
});

export const getSecurityActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await profileService.getSecurityActivity(req.user.id, { page, limit });
  return sendSuccess(res, { message: 'Security activity retrieved', data: result });
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const user = await profileService.updateNotificationPreferences(
    req.user.id,
    req.body,
    reqContext(req)
  );
  return sendSuccess(res, { message: 'Notification preferences updated', data: { user } });
});

export const getConnectedAccounts = asyncHandler(async (req, res) => {
  const result = await profileService.getConnectedAccounts(req.user.id);
  return sendSuccess(res, { message: 'Connected accounts retrieved', data: result });
});

export const connectCloudAccount = asyncHandler(async (req, res) => {
  const user = await profileService.connectCloudAccount(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Cloud account connected', data: { user } });
});

export const disconnectCloudAccount = asyncHandler(async (req, res) => {
  const user = await profileService.disconnectCloudAccount(
    req.user.id,
    req.params.provider,
    reqContext(req)
  );
  return sendSuccess(res, { message: 'Cloud account disconnected', data: { user } });
});

export const exportProfileData = asyncHandler(async (req, res) => {
  const profileData = await profileService.exportProfileData(req.user.id);
  return sendSuccess(res, { message: 'Profile data exported', data: { profile: profileData } });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await profileService.deleteAccount(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Account deleted successfully', data: result });
});

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
