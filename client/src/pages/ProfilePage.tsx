import { useState, type FormEvent } from 'react';
import { Mail, Info, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { updateMyProfile, changeMyPassword } from '../api/auth';
import { errorMessage } from '../api/errors';
import { ROLE_LABELS } from '../api/users';
import { getPasswordError, PASSWORD_HINT } from '../lib/passwordPolicy';

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return (
    new Date(iso).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC'
  );
}

function daysAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return days === 0 ? ' (today)' : ` (${days} day${days === 1 ? '' : 's'} ago)`;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const pageTitle = isAdmin ? 'Administrator Profile' : 'Analyst Profile';
  const roleNote = isAdmin
    ? 'You have full administrative access. Role and permission changes are self-managed.'
    : 'Your role is managed by an administrator. Contact your SOC manager for permission changes.';
  const isDirty = fullName.trim() !== user.username;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!isDirty || fullName.trim().length === 0) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateMyProfile(fullName.trim());
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFullName(user!.username);
    setError(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#e5eaf2]">{pageTitle}</h1>
      <p className="mt-1 text-sm text-[#8593a8]">
        Manage personal settings and view session forensic data.
      </p>
      <div className="mt-6 border-b border-[#232f42]" />

      <div className="mt-8 bg-[#141d2b] border border-[#232f42] rounded-lg p-6 flex gap-5">
        <div className="w-24 h-24 shrink-0 rounded-md bg-[#0a0f1a] border border-[#232f42] flex items-center justify-center">
          <span className="text-2xl font-bold text-[#a9c1f0]">{getInitials(fullName || user.username)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-[#e5eaf2]">{user.username}</h2>
            <span className="text-xs font-mono tracking-wide px-2 py-0.5 rounded border border-[#3a4a63] text-[#c3cede]">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="mt-4 flex gap-2 text-sm text-[#8593a8]">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <span>{roleNote}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#141d2b] border border-[#232f42] rounded-lg p-6">
          <h3 className="text-base font-bold text-[#e5eaf2] pb-4 border-b border-[#232f42]">
            Contact Information
          </h3>

          <div className="mt-5">
            <label
              htmlFor="fullName"
              className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="email"
              className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7a91]" />
              <input
                id="email"
                type="email"
                value={user.email}
                readOnly
                className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md pl-11 pr-10 py-2.5 text-[#8593a8] cursor-not-allowed focus:outline-none"
              />
              <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6b82]" />
            </div>
            <p className="mt-2 text-xs text-[#5b6b82]">
              Your email identifies your account and can't be changed here. Ask an administrator if
              it needs updating.
            </p>
          </div>
        </div>

        <div className="bg-[#141d2b] border border-[#232f42] rounded-lg p-6">
          <h3 className="text-base font-bold text-[#e5eaf2] pb-4 border-b border-[#232f42]">
            Session Audit
          </h3>

          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">
                Account Created
              </dt>
              <dd className="mt-1 text-sm text-[#c3cede]">{formatDate(user.createdAt)}</dd>
            </div>
            <div className="pl-3 border-l-2 border-[#7e93c4]">
              <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">Last Login</dt>
              <dd className="mt-1 text-sm text-[#c3cede]">
                {formatDate(user.lastLoginAt)}
                {daysAgo(user.lastLoginAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">
                Last Sign-in IP
              </dt>
              <dd className="mt-1 text-sm font-mono text-[#c3cede]">
                {user.lastSignInIp ? (
                  <>
                    {user.lastSignInIp} seen at {formatDate(user.lastLoginAt)}
                  </>
                ) : (
                  'Not recorded yet'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-3 border-t border-[#232f42] pt-6 flex justify-end items-center gap-3">
          {saved && <span className="text-sm text-emerald-400 mr-auto">Saved.</span>}
          {error && <span className="text-sm text-red-400 mr-auto">{error}</span>}
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className="px-5 py-2.5 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold hover:bg-[#1a2434] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isDirty || saving || fullName.trim().length === 0}
            className="px-5 py-2.5 rounded-md bg-[#3b6fd6] text-white font-semibold hover:bg-[#3563bd] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const policyError = newPassword ? getPasswordError(newPassword) : null;
  const confirmError =
    confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match.' : null;
  const sameAsCurrent =
    newPassword.length > 0 && newPassword === currentPassword
      ? 'Your new password must be different from your current one.'
      : null;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    !policyError &&
    !confirmError &&
    !sameAsCurrent &&
    confirmPassword.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setDone(false);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(errorMessage(err, 'Could not change your password.'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]';

  return (
    <div className="mt-6 bg-[#141d2b] border border-[#232f42] rounded-lg p-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#232f42]">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-[#7e93c4]" />
          <h3 className="text-base font-bold text-[#e5eaf2]">Password</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#6b7a91] hover:text-[#c3cede]"
        >
          {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPasswords ? 'Hide' : 'Show'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 max-w-md space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
          >
            Current password
          </label>
          <input
            id="currentPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
          >
            New password
          </label>
          <input
            id="newPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <p className={`mt-1.5 text-xs ${policyError ? 'text-red-400' : 'text-[#5b6b82]'}`}>
            {policyError ?? PASSWORD_HINT}
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
          >
            Confirm new password
          </label>
          <input
            id="confirmNewPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          {confirmError && <p className="mt-1.5 text-xs text-red-400">{confirmError}</p>}
        </div>

        {sameAsCurrent && <p className="text-xs text-red-400">{sameAsCurrent}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {done && (
          <p className="text-sm text-emerald-400">
            Password changed. We've emailed you a confirmation.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-5 py-2.5 rounded-md bg-[#3b6fd6] text-white font-semibold hover:bg-[#3563bd] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
