/**
 * Profile page - avatar upload, account details, change email, and change password.
 * Uses the dedicated /api/profile endpoints via authService.
 */
import { useState, useMemo } from 'react';
import useAuth from '../hooks/useAuth.js';
import useNotification from '../hooks/useNotification.js';
import { Spinner } from '../components/ui/Loading.jsx';
import { getErrorMessage } from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';
import AvatarUpload from '../components/ui/AvatarUpload.jsx';
import authService from '../services/auth.service.js';

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /\d/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>[\]\\;'`~_+\-=/]/.test(pw) }
];

function PasswordStrengthIndicator({ password }) {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li key={req.key} className="flex items-center gap-2 text-xs">
            {met ? (
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
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
    <p className={`mt-1 flex items-center gap-1 text-xs ${matches ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {matches ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Passwords match
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Passwords do not match
        </>
      )}
    </p>
  );
}

export default function Profile() {
  const { user, updateProfile, updateAvatar, setUser } = useAuth();
  const { notify } = useNotification();

  // Account details form state
  const [detailsForm, setDetailsForm] = useState({
    name: user?.name || '',
    organization: user?.organization || ''
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    email: user?.email || '',
    currentPassword: ''
  });
  const [savingEmail, setSavingEmail] = useState(false);

  // Password form state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPwd, setSavingPwd] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = useMemo(() => {
    return (user?.name || 'U')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user?.name]);

  // --- Handlers ---

  const handleAvatarChange = async (base64) => {
    setUploadingAvatar(true);
    try {
      const updated = await updateAvatar(base64);
      setUser(updated);
      notify.success('Avatar updated successfully');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      const updated = await authService.updateProfileDetails(detailsForm);
      setUser(updated);
      notify.success('Profile updated successfully');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.email)) {
      notify.error('Please enter a valid email address');
      return;
    }
    if (!emailForm.currentPassword) {
      notify.error('Current password is required to change email');
      return;
    }
    setSavingEmail(true);
    try {
      const updated = await authService.changeEmail({
        email: emailForm.email,
        currentPassword: emailForm.currentPassword
      });
      setUser(updated);
      setEmailForm((f) => ({ ...f, currentPassword: '' }));
      notify.success('Email updated successfully');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      notify.error('New passwords do not match');
      return;
    }
    // Verify all strength requirements are met
    const allMet = PASSWORD_REQUIREMENTS.every((req) => req.test(pwdForm.newPassword));
    if (!allMet) {
      notify.error('Password does not meet all requirements');
      return;
    }
    setSavingPwd(true);
    try {
      await authService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });
      notify.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>

      {/* Top card: Avatar + user info */}
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <AvatarUpload
          currentAvatar={user?.avatarUrl}
          initials={initials}
          onAvatarChange={handleAvatarChange}
          disabled={uploadingAvatar}
        />
        <div className="text-center sm:text-left">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          <div className="mt-2">
            <Badge status="neutral">{user?.role}</Badge>
          </div>
          {user?.organization && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.organization}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account details form */}
        <form onSubmit={handleDetailsSubmit} className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">Account details</h3>
          <div>
            <label htmlFor="profile-name" className="label">Full name</label>
            <input
              id="profile-name"
              className="input"
              value={detailsForm.name}
              onChange={(e) => setDetailsForm((f) => ({ ...f, name: e.target.value }))}
              disabled={savingDetails}
            />
          </div>
          <div>
            <label htmlFor="profile-org" className="label">Organization</label>
            <input
              id="profile-org"
              className="input"
              value={detailsForm.organization}
              onChange={(e) => setDetailsForm((f) => ({ ...f, organization: e.target.value }))}
              disabled={savingDetails}
            />
          </div>
          <button type="submit" disabled={savingDetails} className="btn-primary">
            {savingDetails ? <Spinner size="sm" className="text-white" /> : 'Save changes'}
          </button>
        </form>

        {/* Change email form */}
        <form onSubmit={handleEmailSubmit} className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">Change email</h3>
          <div>
            <label htmlFor="profile-email" className="label">New email address</label>
            <input
              id="profile-email"
              type="email"
              className="input"
              value={emailForm.email}
              onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
              disabled={savingEmail}
            />
          </div>
          <div>
            <label htmlFor="email-password" className="label">Current password</label>
            <input
              id="email-password"
              type="password"
              className="input"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Required to confirm email change"
              disabled={savingEmail}
            />
          </div>
          <button type="submit" disabled={savingEmail} className="btn-primary">
            {savingEmail ? <Spinner size="sm" className="text-white" /> : 'Save email'}
          </button>
        </form>

        {/* Change password form */}
        <form onSubmit={handlePasswordSubmit} className="card space-y-4 p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Change password</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="pwd-current" className="label">Current password</label>
              <input
                id="pwd-current"
                type="password"
                className="input"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                disabled={savingPwd}
              />
            </div>
            <div>
              <label htmlFor="pwd-new" className="label">New password</label>
              <input
                id="pwd-new"
                type="password"
                className="input"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                disabled={savingPwd}
              />
              <PasswordStrengthIndicator password={pwdForm.newPassword} />
            </div>
            <div>
              <label htmlFor="pwd-confirm" className="label">Confirm new password</label>
              <input
                id="pwd-confirm"
                type="password"
                className="input"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                disabled={savingPwd}
              />
              <PasswordMatchIndicator
                newPassword={pwdForm.newPassword}
                confirmPassword={pwdForm.confirmPassword}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">Changing your password signs out other sessions.</p>
          <button type="submit" disabled={savingPwd} className="btn-primary">
            {savingPwd ? <Spinner size="sm" className="text-white" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
