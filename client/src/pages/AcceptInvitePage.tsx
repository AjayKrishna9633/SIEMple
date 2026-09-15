import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, MailQuestion } from 'lucide-react';
import { previewInvite, acceptInvite } from '../api/auth';
import { errorMessage } from '../api/errors';

const PASSWORD_MIN_LENGTH = 12;

function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one symbol.';
  return null;
}

type Stage = 'checking' | 'no-token' | 'bad-token' | 'confirm-email' | 'set-password' | 'done';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [stage, setStage] = useState<Stage>('checking');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStage('no-token');
      return;
    }
    previewInvite(token)
      .then((invite) => {
        setMaskedEmail(invite.maskedEmail);
        setStage('confirm-email');
      })
      .catch((err) => {
        setTokenError(errorMessage(err, 'This invitation is invalid or has expired.'));
        setStage('bad-token');
      });
  }, [token]);

  const passwordError = password ? getPasswordError(password) : null;
  const confirmError =
    confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : null;
  const canSubmit =
    fullName.trim().length > 0 && password.length > 0 && !passwordError && !confirmError;

  // The server re-checks the address on accept; this step just avoids showing
  // the password form to someone who can't name the invited mailbox.
  function handleConfirmEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStage('set-password');
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await acceptInvite({ token, email: email.trim(), username: fullName.trim(), password });
      setStage('done');
    } catch (err) {
      setError(errorMessage(err, 'Could not activate your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
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
          {stage === 'checking' && (
            <p className="text-center text-sm text-[#8593a8]">Checking your invitation…</p>
          )}

          {stage === 'no-token' && (
            <div className="text-center">
              <MailQuestion className="mx-auto text-[#7e93c4]" size={30} />
              <h2 className="mt-3 text-lg font-bold text-[#e5eaf2]">Open your invitation link</h2>
              <p className="mt-2 text-sm text-[#8593a8]">
                Invitations can only be accepted from the link in your invitation email. Check your
                inbox for a message from SIEMple and open the link inside it.
              </p>
              <p className="mt-3 text-xs text-[#5b6b82]">
                No email? Ask an administrator to send you a new invitation.
              </p>
              <Link
                to="/login"
                className="mt-5 block w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {stage === 'bad-token' && (
            <div className="text-center">
              <AlertCircle className="mx-auto text-red-400" size={28} />
              <p className="mt-3 text-sm text-[#8593a8]">{tokenError}</p>
              <p className="mt-2 text-xs text-[#5b6b82]">
                This usually means the link has expired, it was already used, or a newer invitation
                replaced it. Check your inbox for the most recent email from SIEMple — only the
                latest link works.
              </p>
              <p className="mt-2 text-xs text-[#5b6b82]">
                Still stuck? Ask an administrator to resend your invitation.
              </p>
            </div>
          )}

          {stage === 'confirm-email' && (
            <>
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-lg font-bold text-[#e5eaf2]">Confirm Your Email</h2>
                <p className="text-sm text-[#8593a8]">
                  This invitation was sent to{' '}
                  <span className="font-mono text-[#c3cede]">{maskedEmail}</span>. Enter the full
                  address to continue.
                </p>
              </div>

              <form onSubmit={handleConfirmEmail} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organization.com"
                    className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={email.trim().length === 0}
                  className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </form>
            </>
          )}

          {stage === 'set-password' && (
            <>
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-lg font-bold text-[#e5eaf2]">Create Your Account</h2>
                <p className="text-sm text-[#8593a8]">
                  Choose a name and password to finish setting up.
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
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
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-mono text-[#c3cede] mb-1.5"
                  >
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
                  />
                  {confirmError && <p className="mt-1.5 text-xs text-red-400">{confirmError}</p>}
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating account…' : 'Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStage('confirm-email');
                    setError(null);
                  }}
                  className="w-full text-sm text-[#8593a8] hover:text-[#c3cede]"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                Your account is active. You can now sign in with your email and password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Continue to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
