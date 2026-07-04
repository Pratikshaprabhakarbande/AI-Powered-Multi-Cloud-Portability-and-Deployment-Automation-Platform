/**
 * Profile routes — /api/profile
 *
 *  GET    /              auth   get current user profile
 *  PUT    /              auth   update profile (name, organization)
 *  PUT    /email         auth   change email (requires password verification)
 *  PUT    /password      auth   change password
 *  POST   /avatar        auth   upload avatar (base64 data URL)
 *  PUT    /extended      auth   update extended profile fields
 *  POST   /2fa/setup     auth   setup two-factor authentication (rate limited)
 *  POST   /2fa/verify    auth   verify 2FA token and enable
 *  POST   /2fa/disable   auth   disable 2FA (rate limited)
 *  POST   /2fa/backup-codes        auth   get backup codes (requires password)
 *  POST   /2fa/backup-codes/regenerate  auth   regenerate backup codes
 *  GET    /sessions      auth   get active sessions
 *  DELETE /sessions/:id  auth   revoke a specific session
 *  DELETE /sessions      auth   revoke all other sessions
 *  GET    /login-activity   auth   get login activity
 *  GET    /security-activity auth  get security activity
 *  PUT    /notifications    auth   update notification preferences
 *  GET    /cloud-accounts   auth   get connected cloud accounts
 *  POST   /cloud-accounts   auth   connect a cloud account
 *  DELETE /cloud-accounts/:provider  auth   disconnect a cloud account
 *  GET    /export        auth   export profile data
 *  DELETE /account       auth   delete account (rate limited)
 */
import { Router } from 'express';
import express from 'express';
import authController from '../controllers/auth.controller.js';
import profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';
import { updatePresence } from '../middleware/presence.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  updateProfileValidation,
  changeEmailValidation,
  changePasswordValidation,
  uploadAvatarValidation,
  updateExtendedProfileValidation,
  verify2FAValidation,
  disable2FAValidation,
  updateNotificationPrefsValidation,
  connectCloudAccountValidation,
  deleteAccountValidation
} from '../validations/profile.validation.js';

const router = Router();

// All profile routes require authentication.
router.use(authenticate);

// Update presence on every authenticated profile request.
router.use(updatePresence);

// GET /api/profile - get current user profile
router.get('/', authController.getProfile);

// PUT /api/profile - update basic profile fields (name, organization)
router.put('/', validate(updateProfileValidation), authController.updateProfile);

// PUT /api/profile/email - change email with password verification
router.put('/email', authLimiter, validate(changeEmailValidation), authController.changeEmail);

// PUT /api/profile/password - change password
router.put('/password', authLimiter, validate(changePasswordValidation), authController.changePassword);

// POST /api/profile/avatar - upload avatar (base64)
// Use a higher body size limit for avatar uploads (10MB to accommodate base64-encoded images)
router.post(
  '/avatar',
  express.json({ limit: '10mb' }),
  validate(uploadAvatarValidation),
  authController.uploadAvatar
);

// ---- Extended profile routes ----

// PUT /api/profile/extended - update extended profile fields
router.put('/extended', validate(updateExtendedProfileValidation), profileController.updateExtendedProfile);

// POST /api/profile/2fa/setup - setup two-factor authentication (rate limited)
router.post('/2fa/setup', authLimiter, profileController.setup2FA);

// POST /api/profile/2fa/verify - verify 2FA token and enable
router.post('/2fa/verify', validate(verify2FAValidation), profileController.verify2FA);

// POST /api/profile/2fa/disable - disable 2FA (rate limited)
router.post('/2fa/disable', authLimiter, validate(disable2FAValidation), profileController.disable2FA);

// POST /api/profile/2fa/backup-codes - get backup codes (requires password re-authentication)
router.post('/2fa/backup-codes', authLimiter, validate(disable2FAValidation), profileController.getBackupCodes);

// POST /api/profile/2fa/backup-codes/regenerate - regenerate backup codes
router.post('/2fa/backup-codes/regenerate', profileController.regenerateBackupCodes);

// GET /api/profile/sessions - get active sessions
router.get('/sessions', profileController.getActiveSessions);

// DELETE /api/profile/sessions/:id - revoke a specific session
router.delete('/sessions/:id', profileController.revokeSession);

// DELETE /api/profile/sessions - revoke all other sessions
router.delete('/sessions', profileController.revokeAllOtherSessions);

// GET /api/profile/login-activity - get login activity
router.get('/login-activity', profileController.getLoginActivity);

// GET /api/profile/security-activity - get security activity
router.get('/security-activity', profileController.getSecurityActivity);

// PUT /api/profile/notifications - update notification preferences
router.put('/notifications', validate(updateNotificationPrefsValidation), profileController.updateNotificationPreferences);

// GET /api/profile/cloud-accounts - get connected cloud accounts
router.get('/cloud-accounts', profileController.getConnectedAccounts);

// POST /api/profile/cloud-accounts - connect a cloud account
router.post('/cloud-accounts', validate(connectCloudAccountValidation), profileController.connectCloudAccount);

// DELETE /api/profile/cloud-accounts/:provider - disconnect a cloud account
router.delete('/cloud-accounts/:provider', profileController.disconnectCloudAccount);

// GET /api/profile/export - export profile data
router.get('/export', profileController.exportProfileData);

// DELETE /api/profile/account - delete account (rate limited)
router.delete('/account', authLimiter, validate(deleteAccountValidation), profileController.deleteAccount);

export default router;
