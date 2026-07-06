/**
 * Enterprise Profile page - tabbed settings layout with comprehensive account management.
 * Features: Profile info, Email, Security, 2FA, Sessions, Login Activity,
 * Notifications, Theme, Cloud Accounts, Security Activity, Data & Privacy.
 */
import { useState, useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth.js';
import useNotification from '../hooks/useNotification.js';
import useTheme from '../hooks/useTheme.js';
import { Spinner, Skeleton } from '../components/ui/Loading.jsx';
import { getErrorMessage } from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';
import AvatarUpload from '../components/ui/AvatarUpload.jsx';
import Icon from '../components/ui/Icon.jsx';
import authService from '../services/auth.service.js';
import profileService from '../services/profile.service.js';
import credentialsService from '../services/credentials.service.js';

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /\d/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
];

// Tab configuration
const TABS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'two-factor', label: 'Two-Factor Auth', icon: 'key' },
  { id: 'sessions', label: 'Sessions', icon: 'device' },
  { id: 'login-activity', label: 'Login Activity', icon: 'activity' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'theme', label: 'Theme', icon: 'sun' },
  { id: 'cloud-credentials', label: 'Cloud Credentials', icon: 'key' },
  { id: 'cloud-accounts', label: 'Cloud Accounts', icon: 'cloud' },
  { id: 'security-activity', label: 'Security Activity', icon: 'shield' },
  { id: 'data-privacy', label: 'Data & Privacy', icon: 'download' }
];

// --- Helper Components ---

function PasswordStrengthIndicator({ password }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li key={req.key} className="flex items-center gap-2 text-xs">
            <Icon name={met ? 'check-circle' : 'close'} className={"h-3.5 w-3.5 " + (met ? 'text-green-500' : 'text-red-500')} />
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PasswordMatchIndicator({ newPassword, confirmPassword }) {
  if (!confirmPassword) return null;
  const matches = newPassword === confirmPassword;
  return (
    <p className={"mt-1 flex items-center gap-1 text-xs " + (matches ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
      <Icon name={matches ? 'check-circle' : 'close'} className="h-3.5 w-3.5" />
      {matches ? 'Passwords match' : 'Passwords do not match'}
    </p>
  );
}

function PasswordInput({ id, label, value, onChange, disabled, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="input pr-10"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4 transition-opacity duration-200">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

// --- Tab Content Components ---

function ProfileTab({ user, setUser, notify }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    country: user?.country || '',
    timezone: user?.timezone || '',
    jobTitle: user?.jobTitle || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.updateExtendedProfile(form);
      setUser(updated);
      notify.success('Profile updated successfully');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="label">Full Name</label>
          <input id="profile-name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label htmlFor="profile-org" className="label">Organization</label>
          <input id="profile-org" className="input" value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label htmlFor="profile-phone" className="label">Phone</label>
          <input id="profile-phone" className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={saving} placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label htmlFor="profile-job" className="label">Job Title</label>
          <input id="profile-job" className="input" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label htmlFor="profile-country" className="label">Country</label>
          <input id="profile-country" className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label htmlFor="profile-tz" className="label">Time Zone</label>
          <input id="profile-tz" className="input" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} disabled={saving} placeholder="e.g. America/New_York" />
        </div>
      </div>
      <div>
        <label htmlFor="profile-bio" className="label">Bio</label>
        <textarea id="profile-bio" className="input min-h-[100px]" maxLength={500} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} disabled={saving} placeholder="Tell us about yourself..." />
        <p className="mt-1 text-xs text-slate-400">{form.bio.length}/500</p>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm" className="text-white" /> : 'Save changes'}
      </button>
    </form>
  );
}

function EmailTab({ user, setUser, notify }) {
  const [form, setForm] = useState({ email: user?.email || '', currentPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { notify.error('Please enter a valid email address'); return; }
    if (!form.currentPassword) { notify.error('Current password is required to change email'); return; }
    setSaving(true);
    try {
      const updated = await authService.changeEmail({ email: form.email, currentPassword: form.currentPassword });
      setUser(updated);
      setForm((f) => ({ ...f, currentPassword: '' }));
      notify.success('Email updated successfully');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Email Address</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</span>
        {user?.emailVerified ? (
          <Badge status="success">Verified</Badge>
        ) : (
          <Badge status="pending">Unverified</Badge>
        )}
      </div>
      {!user?.emailVerified && (
        <button type="button" onClick={() => notify.info('Verification email sent. Please check your inbox.')} className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Send verification email
        </button>
      )}
      <div>
        <label htmlFor="new-email" className="label">New email address</label>
        <input id="new-email" type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={saving} />
      </div>
      <PasswordInput id="email-pwd" label="Current password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} disabled={saving} placeholder="Required to confirm email change" />
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm" className="text-white" /> : 'Update email'}
      </button>
    </form>
  );
}

function SecurityTab({ notify }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { notify.error('New passwords do not match'); return; }
    const allMet = PASSWORD_REQUIREMENTS.every((req) => req.test(form.newPassword));
    if (!allMet) { notify.error('Password does not meet all requirements'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      notify.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Changing your password will sign out all other sessions.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PasswordInput id="pwd-current" label="Current password" value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} disabled={saving} />
        <div>
          <PasswordInput id="pwd-new" label="New password" value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} disabled={saving} />
          <PasswordStrengthIndicator password={form.newPassword} />
        </div>
        <div>
          <PasswordInput id="pwd-confirm" label="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} disabled={saving} />
          <PasswordMatchIndicator newPassword={form.newPassword} confirmPassword={form.confirmPassword} />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm" className="text-white" /> : 'Update password'}
      </button>
    </form>
  );
}

function TwoFactorTab({ user, setUser, notify }) {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [backupCodesPassword, setBackupCodesPassword] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await profileService.setup2FA();
      setSetupData(data);
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (verifyToken.length !== 6) { notify.error('Please enter a 6-digit code'); return; }
    setLoading(true);
    try {
      await profileService.verify2FA(verifyToken);
      setUser((prev) => ({ ...prev, twoFactorEnabled: true }));
      setBackupCodes(setupData?.backupCodes || []);
      setSetupData(null);
      setVerifyToken('');
      notify.success('Two-factor authentication enabled');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleDisable = async () => {
    if (!disablePassword) { notify.error('Password is required'); return; }
    setLoading(true);
    try {
      await profileService.disable2FA(disablePassword);
      setUser((prev) => ({ ...prev, twoFactorEnabled: false }));
      setShowDisableModal(false);
      setDisablePassword('');
      notify.success('Two-factor authentication disabled');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleViewBackupCodes = async () => {
    if (!backupCodesPassword) { notify.error('Password is required to view backup codes'); return; }
    setLoading(true);
    try {
      const codes = await profileService.getBackupCodes(backupCodesPassword);
      setBackupCodes(codes);
      setShowBackupCodesModal(false);
      setBackupCodesPassword('');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleRegenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const codes = await profileService.regenerateBackupCodes();
      setBackupCodes(codes);
      notify.success('Backup codes regenerated');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const copyBackupCodes = () => {
    const text = (backupCodes || []).map((c) => (typeof c === 'string' ? c : c.code)).join('\n');
    navigator.clipboard.writeText(text);
    notify.success('Backup codes copied to clipboard');
  };

  if (loading && !setupData) return <TabSkeleton />;

  return (
    <div className="space-y-6 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h3>

      {user?.twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge status="success">2FA Enabled</Badge>
            <Icon name="check-circle" className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Your account is protected with two-factor authentication.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowBackupCodesModal(true)} className="btn-primary">{loading ? <Spinner size="sm" className="text-white" /> : 'View backup codes'}</button>
            <button type="button" onClick={handleRegenerateBackupCodes} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Regenerate codes</button>
            <button type="button" onClick={() => setShowDisableModal(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950">Disable 2FA</button>
          </div>
        </div>
      ) : setupData ? (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center mb-4">
              <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="h-48 w-48 rounded-lg border border-slate-200 dark:border-slate-700" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Or enter this secret manually:</p>
            <code className="block rounded bg-slate-100 dark:bg-slate-800 p-2 text-xs font-mono break-all">{setupData.secret}</code>
          </div>
          <div>
            <label htmlFor="verify-token" className="label">Enter 6-digit verification code</label>
            <input id="verify-token" className="input max-w-xs" maxLength={6} value={verifyToken} onChange={(e) => setVerifyToken(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" />
          </div>
          <button type="button" onClick={handleVerify} disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" className="text-white" /> : 'Verify and Enable'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">Two-factor authentication adds an extra layer of security to your account. You will need to enter a code from your authenticator app each time you sign in.</p>
          </div>
          <button type="button" onClick={handleSetup} disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" className="text-white" /> : 'Enable Two-Factor Authentication'}
          </button>
        </div>
      )}

      {backupCodes && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900 dark:text-white">Backup Codes</h4>
            <button type="button" onClick={copyBackupCodes} className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">Copy all</button>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">Save these codes in a safe place. Each code can only be used once.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {backupCodes.map((code, i) => {
              const codeStr = typeof code === 'string' ? code : code.code;
              const used = typeof code === 'object' && code.used;
              return (
                <span key={i} className={"rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-center font-mono text-xs " + (used ? 'line-through opacity-50' : '')}>
                  {codeStr}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {showBackupCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card mx-4 w-full max-w-md space-y-4 p-6">
            <h4 className="font-semibold text-slate-900 dark:text-white">View Backup Codes</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter your password to view your backup recovery codes.</p>
            <PasswordInput id="backup-codes-pwd" label="Current password" value={backupCodesPassword} onChange={(e) => setBackupCodesPassword(e.target.value)} disabled={loading} />
            <div className="flex gap-3">
              <button type="button" onClick={handleViewBackupCodes} disabled={loading || !backupCodesPassword} className="btn-primary">
                {loading ? <Spinner size="sm" className="text-white" /> : 'View codes'}
              </button>
              <button type="button" onClick={() => { setShowBackupCodesModal(false); setBackupCodesPassword(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card mx-4 w-full max-w-md space-y-4 p-6">
            <h4 className="font-semibold text-slate-900 dark:text-white">Disable Two-Factor Authentication</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter your password to confirm disabling 2FA. This will make your account less secure.</p>
            <PasswordInput id="disable-2fa-pwd" label="Current password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} disabled={loading} />
            <div className="flex gap-3">
              <button type="button" onClick={handleDisable} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                {loading ? <Spinner size="sm" className="text-white" /> : 'Disable 2FA'}
              </button>
              <button type="button" onClick={() => { setShowDisableModal(false); setDisablePassword(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsTab({ notify }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService.getActiveSessions()
      .then(setSessions)
      .catch((err) => notify.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (id) => {
    try {
      await profileService.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      notify.success('Session revoked');
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  const handleRevokeAll = async () => {
    try {
      const result = await profileService.revokeAllOtherSessions();
      setSessions([]);
      notify.success('All sessions revoked (' + (result.revokedCount || 0) + '). Please log in again.');
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Sessions</h3>
        {sessions.length > 1 && (
          <button type="button" onClick={handleRevokeAll} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            Revoke all sessions
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Note: The current session cannot be identified. Revoking all sessions will require you to log in again.
      </p>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">No active sessions found.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon name="device" className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Session {session.id?.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created: {new Date(session.createdAt).toLocaleString()} | Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => handleRevoke(session.id)} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginActivityTab({ notify }) {
  const [data, setData] = useState({ entries: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    profileService.getLoginActivity(page, 20)
      .then(setData)
      .catch((err) => notify.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown device';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.slice(0, 30);
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Login Activity</h3>
      {data.entries.length > 0 && (
        <div className="card p-4 border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Last successful login</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {new Date(data.entries[0].createdAt).toLocaleString()} from {data.entries[0].ip || 'unknown IP'}
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Date/Time</th>
              <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">IP Address</th>
              <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Browser</th>
              <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="py-2 text-slate-700 dark:text-slate-300">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{entry.ip || '-'}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{parseUserAgent(entry.userAgent)}</td>
                <td className="py-2">
                  <Badge status={entry.success ? 'success' : 'failed'}>{entry.success ? 'Success' : 'Failed'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-sm text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400">Previous</button>
          <span className="text-xs text-slate-500">Page {data.page} of {data.totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="text-sm text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400">Next</button>
        </div>
      )}
    </div>
  );
}

function NotificationsTab({ user, setUser, notify }) {
  const [prefs, setPrefs] = useState({
    emailNotifications: user?.notificationPreferences?.emailNotifications ?? user?.preferences?.emailNotifications ?? true,
    securityAlerts: user?.notificationPreferences?.securityAlerts ?? true,
    deploymentNotifications: user?.notificationPreferences?.deploymentNotifications ?? true,
    monitoringAlerts: user?.notificationPreferences?.monitoringAlerts ?? true,
    marketingEmails: user?.notificationPreferences?.marketingEmails ?? false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateNotificationPreferences(prefs);
      setUser((prev) => ({ ...prev, notificationPreferences: prefs }));
      notify.success('Notification preferences saved');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleItems = [
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates about your account' },
    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Get notified about security events' },
    { key: 'deploymentNotifications', label: 'Deployment Notifications', desc: 'Receive notifications when deployments complete' },
    { key: 'monitoringAlerts', label: 'Monitoring Alerts', desc: 'Get alerts for monitoring threshold breaches' },
    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive product updates and newsletters' }
  ];

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
      <div className="space-y-4">
        {toggleItems.map((item) => (
          <label key={item.key} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm" className="text-white" /> : 'Save preferences'}
      </button>
    </div>
  );
}

function ThemeTab({ notify }) {
  const { theme, setTheme } = useTheme();
  const { updateProfile } = useAuth();

  const themes = [
    { key: 'light', label: 'Light', desc: 'A clean, bright interface', icon: 'sun' },
    { key: 'dark', label: 'Dark', desc: 'Easier on the eyes in low light', icon: 'moon' },
    { key: 'system', label: 'System', desc: 'Matches your device settings', icon: 'cog' }
  ];

  const handleThemeChange = async (key) => {
    setTheme(key);
    try {
      await updateProfile({ preferences: { theme: key } });
    } catch {
      // Silent - theme is already applied locally
    }
  };

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Theme Preferences</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Choose how the application looks to you.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {themes.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleThemeChange(t.key)}
            className={"flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition " + (
              theme === t.key
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            )}
          >
            <Icon name={t.icon} className={"h-8 w-8 " + (theme === t.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400')} />
            <div className="text-center">
              <p className={"text-sm font-medium " + (theme === t.key ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300')}>{t.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
            </div>
            {theme === t.key && <Icon name="check-circle" className="h-5 w-5 text-brand-600 dark:text-brand-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function CloudCredentialsTab({ notify }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    credentialsService.getStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const providers = [
    { key: 'aws', label: 'Amazon Web Services', color: 'border-l-aws', fields: [
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', placeholder: 'AKIA...' },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: '••••••••' },
      { name: 'region', label: 'Default Region', type: 'text', placeholder: 'us-east-1' }
    ]},
    { key: 'azure', label: 'Microsoft Azure', color: 'border-l-azure', fields: [
      { name: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: '00000000-...' },
      { name: 'clientId', label: 'Client ID', type: 'text', placeholder: '00000000-...' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
      { name: 'subscriptionId', label: 'Subscription ID', type: 'text', placeholder: '00000000-...' }
    ]},
    { key: 'gcp', label: 'Google Cloud Platform', color: 'border-l-gcp', fields: [
      { name: 'serviceAccountJson', label: 'Service Account JSON', type: 'textarea', placeholder: '{ "type": "service_account", ... }' },
      { name: 'projectId', label: 'Project ID', type: 'text', placeholder: 'my-project-123' }
    ]}
  ];

  const handleSave = async (providerKey) => {
    try {
      const updated = await credentialsService.save(providerKey, form);
      setStatus(updated);
      setExpanded(null);
      setForm({});
      notify.success(`${providerKey.toUpperCase()} credentials saved`);
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  const handleTest = async (providerKey) => {
    setTesting(providerKey);
    try {
      const result = await credentialsService.test(providerKey);
      if (result.connected) notify.success(`${providerKey.toUpperCase()}: connection successful`);
      else notify.error(`${providerKey.toUpperCase()}: ${result.error || 'connection failed'}`);
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setTesting(null); }
  };

  const handleRemove = async (providerKey) => {
    if (!window.confirm(`Remove ${providerKey.toUpperCase()} credentials?`)) return;
    try {
      const updated = await credentialsService.remove(providerKey);
      setStatus(updated);
      notify.success(`${providerKey.toUpperCase()} credentials removed`);
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  if (loading) return <TabSkeleton />;

  const anyConnected = status && (status.aws?.connected || status.azure?.connected || status.gcp?.connected);

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cloud Credentials</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${anyConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
          <span className={`h-2 w-2 rounded-full ${anyConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
          {anyConnected ? 'Live Mode' : 'Demo Mode'}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {anyConnected ? 'Deployments will use connected cloud providers.' : 'Running in Demo Mode. Configure credentials below to enable live deployments.'}
      </p>

      <div className="space-y-4">
        {providers.map((p) => {
          const connected = status?.[p.key]?.connected;
          return (
            <div key={p.key} className={`card border-l-4 ${p.color} p-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">
                    {p.key.toUpperCase().charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{p.label}</p>
                    <Badge status={connected ? 'operational' : 'outage'}>{connected ? 'Connected' : 'Not Connected'}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {connected && (
                    <button type="button" className="btn-secondary text-xs" onClick={() => handleTest(p.key)} disabled={testing === p.key}>
                      {testing === p.key ? <Spinner size="sm" /> : 'Test Connection'}
                    </button>
                  )}
                  <button type="button" className="btn-secondary text-xs" onClick={() => setExpanded(expanded === p.key ? null : p.key)}>
                    {expanded === p.key ? 'Cancel' : connected ? 'Update' : 'Configure'}
                  </button>
                  {connected && (
                    <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => handleRemove(p.key)}>Remove</button>
                  )}
                </div>
              </div>

              {expanded === p.key && (
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  {p.fields.map((f) => (
                    <div key={f.name}>
                      <label className="label">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea className="input h-24 font-mono text-xs" placeholder={f.placeholder} value={form[f.name] || ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                      ) : (
                        <input type={f.type} className="input" placeholder={f.placeholder} value={form[f.name] || ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-primary text-sm" onClick={() => handleSave(p.key)}>Save Credentials</button>
                  <p className="text-xs text-slate-400">Credentials are encrypted (AES-256-GCM) before storage. Never exposed in API responses.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CloudAccountsTab({ notify }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(null);
  const [connectForm, setConnectForm] = useState({ accountId: '', region: '' });

  useEffect(() => {
    profileService.getConnectedAccounts()
      .then(setAccounts)
      .catch((err) => notify.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const providers = [
    { id: 'aws', name: 'Amazon Web Services', color: 'border-amber-400' },
    { id: 'azure', name: 'Microsoft Azure', color: 'border-blue-400' },
    { id: 'gcp', name: 'Google Cloud Platform', color: 'border-red-400' }
  ];

  const handleConnect = async (provider) => {
    if (!connectForm.accountId || !connectForm.region) { notify.error('Account ID and region are required'); return; }
    try {
      await profileService.connectCloudAccount({ provider, accountId: connectForm.accountId, region: connectForm.region });
      setAccounts((prev) => [...prev.filter((a) => a.provider !== provider), { provider, accountId: connectForm.accountId, region: connectForm.region, status: 'connected', connectedAt: new Date().toISOString() }]);
      setShowConnect(null);
      setConnectForm({ accountId: '', region: '' });
      notify.success(provider.toUpperCase() + ' account connected');
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  const handleDisconnect = async (provider) => {
    try {
      await profileService.disconnectCloudAccount(provider);
      setAccounts((prev) => prev.map((a) => a.provider === provider ? { ...a, status: 'disconnected' } : a));
      notify.success(provider.toUpperCase() + ' account disconnected');
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Connected Cloud Accounts</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {providers.map((p) => {
          const account = accounts.find((a) => a.provider === p.id);
          const connected = account && account.status === 'connected';
          return (
            <div key={p.id} className={"card border-l-4 p-4 " + p.color}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="cloud" className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <h4 className="font-medium text-slate-900 dark:text-white text-sm">{p.name}</h4>
              </div>
              {connected ? (
                <div className="space-y-2">
                  <Badge status="success">Connected</Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {account.accountId}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Region: {account.region}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Since: {new Date(account.connectedAt).toLocaleDateString()}</p>
                  <button type="button" onClick={() => handleDisconnect(p.id)} className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400">Disconnect</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge status="neutral">Not connected</Badge>
                  {showConnect === p.id ? (
                    <div className="space-y-2 mt-2">
                      <input className="input text-xs" placeholder="Account ID" value={connectForm.accountId} onChange={(e) => setConnectForm((f) => ({ ...f, accountId: e.target.value }))} />
                      <input className="input text-xs" placeholder="Region (e.g. us-east-1)" value={connectForm.region} onChange={(e) => setConnectForm((f) => ({ ...f, region: e.target.value }))} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleConnect(p.id)} className="btn-primary text-xs">Connect</button>
                        <button type="button" onClick={() => setShowConnect(null)} className="text-xs text-slate-500">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowConnect(p.id)} className="mt-2 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">Connect account</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SecurityActivityTab({ notify }) {
  const [data, setData] = useState({ entries: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    profileService.getSecurityActivity(page, 20)
      .then(setData)
      .catch((err) => notify.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  const getActionIcon = (action) => {
    if (action?.includes('login')) return 'user';
    if (action?.includes('password')) return 'shield';
    if (action?.includes('email')) return 'mail';
    if (action?.includes('2fa') || action?.includes('two')) return 'lock';
    if (action?.includes('session')) return 'device';
    return 'activity';
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-4 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security Activity Timeline</h3>
      {data.entries.length === 0 ? (
        <p className="text-sm text-slate-500">No security activity recorded yet.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-4 pl-10">
            {data.entries.map((entry) => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-10 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Icon name={getActionIcon(entry.action)} className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.description || entry.action}</p>
                    <Badge status={entry.success ? 'success' : 'failed'}>{entry.success ? 'Success' : 'Failed'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(entry.createdAt).toLocaleString()} {entry.ip ? '| IP: ' + entry.ip : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-sm text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400">Previous</button>
          <span className="text-xs text-slate-500">Page {data.page} of {data.totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="text-sm text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400">Next</button>
        </div>
      )}
    </div>
  );
}

function DataPrivacyTab({ notify, logout }) {
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const profileData = await profileService.exportProfileData();
      const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile-export-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success('Profile data exported');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { notify.error('Password is required'); return; }
    if (!deleteConfirm) { notify.error('Please confirm you understand this action is irreversible'); return; }
    setDeleting(true);
    try {
      await profileService.deleteAccount(deletePassword);
      notify.success('Account deleted');
      logout();
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 transition-opacity duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Data & Privacy</h3>

      {/* Export Section */}
      <div className="card p-5 space-y-3">
        <h4 className="font-medium text-slate-900 dark:text-white">Download Your Data</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">Export a copy of your profile data as a JSON file.</p>
        <button type="button" onClick={handleExport} disabled={exporting} className="btn-primary">
          {exporting ? <Spinner size="sm" className="text-white" /> : (
            <span className="flex items-center gap-2"><Icon name="download" className="h-4 w-4" /> Download my data</span>
          )}
        </button>
      </div>

      {/* Delete Account Section */}
      <div className="card border-red-200 dark:border-red-800 p-5 space-y-3">
        <h4 className="font-medium text-red-700 dark:text-red-400">Danger Zone</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">Once you delete your account, there is no going back. Please be certain.</p>
        <button type="button" onClick={() => setShowDeleteModal(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950">
          Delete my account
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card mx-4 w-full max-w-md space-y-4 p-6">
            <h4 className="font-semibold text-red-700 dark:text-red-400">Delete Account</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">This action is permanent and cannot be undone. All your data will be deleted.</p>
            <PasswordInput id="delete-account-pwd" label="Enter your password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} disabled={deleting} />
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">I understand this action is irreversible</span>
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={handleDelete} disabled={deleting || !deleteConfirm || !deletePassword} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? <Spinner size="sm" className="text-white" /> : 'Permanently delete account'}
              </button>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirm(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Profile Component ---

export default function Profile() {
  const { user, updateProfile, updateAvatar, setUser, logout } = useAuth();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile completion percentage
  const profileCompletion = useMemo(() => {
    const fields = ['name', 'email', 'organization', 'bio', 'phone', 'country', 'timezone', 'jobTitle', 'avatarUrl'];
    const filled = fields.filter((f) => user?.[f] && String(user[f]).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  // Security score
  const securityScore = useMemo(() => {
    let score = 0;
    score += 25; // password always set
    if (user?.twoFactorEnabled) score += 25;
    if (user?.emailVerified) score += 25;
    if (user?.lastLoginAt) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      if (new Date(user.lastLoginAt).getTime() > thirtyDaysAgo) score += 25;
    }
    return score;
  }, [user]);

  const securityScoreColor = securityScore < 50 ? 'text-red-600 dark:text-red-400' : securityScore < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';
  const securityScoreBg = securityScore < 50 ? 'bg-red-100 dark:bg-red-900/40' : securityScore < 75 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-green-100 dark:bg-green-900/40';

  // Online presence
  const isOnline = useMemo(() => {
    if (!user?.lastSeenAt) return false;
    return (Date.now() - new Date(user.lastSeenAt).getTime()) < 5 * 60 * 1000;
  }, [user]);

  const initials = useMemo(() => {
    return (user?.name || 'U')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user?.name]);

  const handleAvatarChange = async (base64) => {
    setUploadingAvatar(true);
    try {
      const updated = await updateAvatar(base64);
      setUser(updated);
      notify.success('Avatar updated successfully');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setUploadingAvatar(false); }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab user={user} setUser={setUser} notify={notify} />;
      case 'email': return <EmailTab user={user} setUser={setUser} notify={notify} />;
      case 'security': return <SecurityTab notify={notify} />;
      case 'two-factor': return <TwoFactorTab user={user} setUser={setUser} notify={notify} />;
      case 'sessions': return <SessionsTab notify={notify} />;
      case 'login-activity': return <LoginActivityTab notify={notify} />;
      case 'notifications': return <NotificationsTab user={user} setUser={setUser} notify={notify} />;
      case 'theme': return <ThemeTab notify={notify} />;
      case 'cloud-credentials': return <CloudCredentialsTab notify={notify} />;
      case 'cloud-accounts': return <CloudAccountsTab notify={notify} />;
      case 'security-activity': return <SecurityActivityTab notify={notify} />;
      case 'data-privacy': return <DataPrivacyTab notify={notify} logout={logout} />;
      default: return <ProfileTab user={user} setUser={setUser} notify={notify} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <AvatarUpload
            currentAvatar={user?.avatarUrl}
            initials={initials}
            onAvatarChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <span className={"flex items-center gap-1 text-xs " + (isOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-400')}>
                <span className={"inline-block h-2 w-2 rounded-full " + (isOnline ? 'bg-green-500' : 'bg-slate-400')} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge status="neutral">{user?.role}</Badge>
              {user?.organization && <span className="text-xs text-slate-500 dark:text-slate-400">{user.organization}</span>}
            </div>

            {/* Profile Completion & Security Score */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Profile Completion</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: profileCompletion + '%' }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + securityScoreBg + ' ' + securityScoreColor}>
                  Security Score: {securityScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation - horizontal scroll on mobile, vertical on desktop */}
        <nav className="flex overflow-x-auto lg:w-56 lg:flex-col lg:overflow-x-visible" aria-label="Profile settings">
          <div className="flex gap-1 lg:flex-col lg:gap-0.5 min-w-max lg:min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={"flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition " + (
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Icon name={tab.icon} className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="card flex-1 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
