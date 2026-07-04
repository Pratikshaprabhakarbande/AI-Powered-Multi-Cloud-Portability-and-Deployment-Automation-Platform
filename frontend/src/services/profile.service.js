/**
 * Profile API service - maps to the enterprise /api/profile endpoints.
 * Each method calls the appropriate HTTP verb and extracts the data payload.
 */
import api from './api.js';

const profileService = {
  // Extended profile fields (bio, phone, country, timezone, jobTitle, etc.)
  updateExtendedProfile: (payload) =>
    api.put('/profile/extended', payload).then((r) => r.data.data.user),

  // --- Two-Factor Authentication ---
  setup2FA: () =>
    api.post('/profile/2fa/setup').then((r) => r.data.data),

  verify2FA: (token) =>
    api.post('/profile/2fa/verify', { token }).then((r) => r.data.data),

  disable2FA: (currentPassword) =>
    api.post('/profile/2fa/disable', { currentPassword }).then((r) => r.data.data),

  getBackupCodes: () =>
    api.get('/profile/2fa/backup-codes').then((r) => r.data.data.backupCodes),

  regenerateBackupCodes: () =>
    api.post('/profile/2fa/backup-codes/regenerate').then((r) => r.data.data.backupCodes),

  // --- Sessions ---
  getActiveSessions: () =>
    api.get('/profile/sessions').then((r) => r.data.data.sessions),

  revokeSession: (id) =>
    api.delete(`/profile/sessions/${id}`).then((r) => r.data.data),

  revokeAllOtherSessions: () =>
    api.delete('/profile/sessions').then((r) => r.data.data),

  // --- Activity ---
  getLoginActivity: (page = 1, limit = 20) =>
    api.get(`/profile/login-activity?page=${page}&limit=${limit}`).then((r) => r.data.data),

  getSecurityActivity: (page = 1, limit = 20) =>
    api.get(`/profile/security-activity?page=${page}&limit=${limit}`).then((r) => r.data.data),

  // --- Notification Preferences ---
  updateNotificationPreferences: (prefs) =>
    api.put('/profile/notifications', prefs).then((r) => r.data.data),

  // --- Cloud Accounts ---
  getConnectedAccounts: () =>
    api.get('/profile/cloud-accounts').then((r) => r.data.data.accounts),

  connectCloudAccount: (payload) =>
    api.post('/profile/cloud-accounts', payload).then((r) => r.data.data),

  disconnectCloudAccount: (provider) =>
    api.delete(`/profile/cloud-accounts/${provider}`).then((r) => r.data.data),

  // --- Data & Privacy ---
  exportProfileData: () =>
    api.get('/profile/export').then((r) => r.data.data.profile),

  deleteAccount: (currentPassword) =>
    api.delete('/profile/account', { data: { currentPassword } }).then((r) => r.data.data)
};

export default profileService;
