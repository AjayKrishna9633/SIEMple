import { useEffect, useState, type FormEvent } from 'react';
import { Shield, Cloud, Eye, EyeOff, Info } from 'lucide-react';
import { getSetupStatus, createInitialAdmin } from '../api/setup';
import OtpVerificationPage from './OtpVerificationPage';

export interface SetupPageProps {
  onSetupComplete: () => void;
}

const PASSWORD_MIN_LENGTH = 12;

function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one symbol.';
  }
  return null;
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSetupStatus()
      .then((status) => setSetupComplete(status.isSetupComplete))
      .catch(() => setError('Could not reach the server to check setup status.'))
      .finally(() => setCheckingStatus(false));
  }, []);

  const passwordError = password ? getPasswordError(password) : null;
  const confirmError = confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : null;
  const isValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !passwordError &&
    !confirmError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      const admin = await createInitialAdmin({
        username: fullName.trim(),
        email: email.trim(),
        password,
      });
      setChallengeId(admin.challengeId);
    } catch {
      setError('Could not create the administrator account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (challengeId && !success) {
    return (
      <OtpVerificationPage
        challengeId={challengeId}
        purpose="email-verification"
        email={email.trim()}
        onVerified={() => setSuccess(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b111a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg overflow-hidden">
        <div className="px-8 pt-10 pb-6 border-b border-[#232f42] text-center">
          <Shield className="mx-auto text-[#7e93c4]" size={40} strokeWidth={1.75} />
          <h1 className="mt-4 text-2xl font-bold text-[#a9c1f0]">SIEMple</h1>
          <p className="mt-1 text-xs tracking-[0.2em] font-mono text-[#6b7a91] uppercase">SOC OPS</p>
        </div>

        <div className="px-8 py-8">
          {checkingStatus ? (
            <p className="text-center text-sm text-[#8593a8]">Checking setup status…</p>
          ) : setupComplete ? (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                Setup has already been completed. An administrator account exists.
              </p>
              <button
                type="button"
                onClick={onSetupComplete}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Continue to Sign In
              </button>
            </div>
          ) : success ? (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                Email verified and administrator account created. You can now sign in.
              </p>
              <button
                type="button"
                onClick={onSetupComplete}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-lg font-bold text-[#e5eaf2]">Welcome — Set Up Your Organization</h2>
                <p className="text-sm text-[#8593a8]">
                  No administrator account exists yet. Create the first one to get started.
                </p>
              </div>

              <button
                type="button"
                disabled
                title="Azure AD sign-in isn't available yet"
                className="w-full flex items-center justify-center gap-2 bg-[#232f42] text-[#dbe4f5] py-3 rounded-md font-semibold opacity-60 cursor-not-allowed"
              >
                <Cloud size={18} />
                Sign in with Azure AD
              </button>
              <p className="mt-2 text-xs text-center text-[#5b6b82]">
                The first person to sign in here becomes the Administrator.
              </p>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-[#232f42]" />
                <span className="text-xs font-mono text-[#5b6b82]">OR</span>
                <div className="h-px flex-1 bg-[#232f42]" />
              </div>

              <p className="text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-4">
                Create a local administrator account
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@organization.com"
                    className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 pr-11 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a91]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className={`mt-1.5 text-xs ${passwordError ? 'text-red-400' : 'text-[#5b6b82]'}`}>
                    {passwordError ?? 'Minimum 12 characters, including one number and one symbol.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 pr-11 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a91]"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmError && <p className="mt-1.5 text-xs text-red-400">{confirmError}</p>}
                </div>

                <div className="flex gap-3 bg-[#18233a] border border-[#232f42] rounded-md p-3">
                  <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-[#8593a8]">
                    This account will have full Administrator access, including user management, rule
                    configuration, and system settings.
                  </p>
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating…' : 'Create Administrator Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
