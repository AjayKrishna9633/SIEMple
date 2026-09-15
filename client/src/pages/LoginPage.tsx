import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { login, requestEmergencyAccess, forgotPassword } from '../api/auth';
import { requestAccess } from '../api/accessRequests';
import { errorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import OtpVerificationPage from './OtpVerificationPage';

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const [challengeId, setChallengeId] = useState('');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [accessRequestOpen, setAccessRequestOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthenticating(true);
    setLoginError(null);
    try {
      const result = await login({ email, password });
      // An approved emergency grant signs in directly, skipping the code step.
      if (result.emergencyAccess) {
        setUser(result.user);
        navigate('/settings/users', { replace: true });
        return;
      }
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      setLoginError(errorMessage(err, 'Invalid credentials'));
    } finally {
      setAuthenticating(false);
    }
  }

  if (step === 'otp') {
    return (
      <OtpVerificationPage
        challengeId={challengeId}
        purpose="login"
        email={email}
        onVerified={(user) => {
          setUser(user);
          navigate('/settings/users', { replace: true });
        }}
        onBack={() => setStep('credentials')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b111a]">
      <div className="py-8 border-b border-[#232f42] text-center">
        <div className="flex items-center justify-center gap-2.5">
          <Shield className="text-[#7e93c4]" size={28} strokeWidth={2} />
          <h1 className="text-2xl font-extrabold tracking-wide text-white">SIEMple</h1>
        </div>
        <p className="mt-2 text-xs tracking-[0.3em] text-[#6b7a91] uppercase">SOC Ops</p>
      </div>

      <div className="flex justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg p-8">
          {step === 'credentials' && (
            <>
              <h2 className="text-xl font-bold text-center text-[#e5eaf2]">Secure Access</h2>
              <p className="mt-1 text-sm text-center text-[#8593a8]">Authenticate to access SOC capabilities.</p>

              <p className="mt-6 mb-4 text-sm text-center text-[#8593a8]">
                Sign-in requires a one-time code
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Operator ID"
                  className={`w-full bg-[#0a0f1a] border rounded-md px-4 py-2.5 text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none ${
                    loginError ? 'border-red-500' : 'border-[#232f42] focus:border-[#7e93c4]'
                  }`}
                />

                {loginError && (
                  <p className="flex items-center gap-1.5 text-sm text-red-400">
                    <AlertCircle size={16} />
                    {loginError}
                  </p>
                )}

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passphrase"
                    className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 pr-11 text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a91]"
                    aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-sm text-[#7e93c4] hover:text-[#a9c1f0]"
                  >
                    Forgot passphrase?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!email || !password || authenticating}
                  className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {authenticating ? 'Authenticating…' : 'Login'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setEmergencyOpen(true)}
                title="Ask an administrator to let you sign in without the emailed code"
                className="mt-6 w-full flex items-center justify-center gap-2 border border-orange-900/50 text-orange-400/80 py-2.5 rounded-md text-xs font-mono tracking-wide uppercase hover:bg-orange-950/30 hover:text-orange-300"
              >
                <AlertTriangle size={14} />
                Request Emergency Access
              </button>

              <div className="mt-6 pt-5 border-t border-[#232f42] space-y-2 text-center text-sm text-[#8593a8]">
                <p>
                  Have an invitation?{' '}
                  <Link to="/accept-invite" className="text-[#7e93c4] hover:text-[#a9c1f0]">
                    Accept it here
                  </Link>
                </p>
                <p>
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => setAccessRequestOpen(true)}
                    className="text-[#7e93c4] hover:text-[#a9c1f0]"
                  >
                    Request access
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {emergencyOpen && (
        <EmergencyAccessModal defaultEmail={email} onClose={() => setEmergencyOpen(false)} />
      )}

      {accessRequestOpen && (
        <AccessRequestModal defaultEmail={email} onClose={() => setAccessRequestOpen(false)} />
      )}

      {forgotOpen && (
        <ForgotPasswordModal defaultEmail={email} onClose={() => setForgotOpen(false)} />
      )}
    </div>
  );
}

function ForgotPasswordModal({
  defaultEmail,
  onClose,
}: {
  defaultEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not send a reset link.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f42]">
          <h2 className="font-bold text-[#e5eaf2]">Reset your passphrase</h2>
          <button type="button" onClick={onClose} className="text-[#6b7a91] hover:text-[#c3cede]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                If that account exists, a reset link is on its way. Check your inbox.
              </p>
              <p className="mt-2 text-xs text-[#5b6b82]">
                The link expires in 1 hour and can only be used once.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#5b6b82]">
                Enter your email and we'll send a link to choose a new passphrase.
              </p>

              <div>
                <label
                  htmlFor="fp-email"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="px-4 py-2 rounded-md bg-[#aebfe4] text-[#141d2b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AccessRequestModal({
  defaultEmail,
  onClose,
}: {
  defaultEmail: string;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestAccess({ fullName: fullName.trim(), email: email.trim(), reason: reason.trim() });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not submit your request.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f42]">
          <h2 className="font-bold text-[#e5eaf2]">Request access</h2>
          <button type="button" onClick={onClose} className="text-[#6b7a91] hover:text-[#c3cede]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                Your request has been submitted. If an administrator approves it, you'll receive an
                invitation email with a link to set your password.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#5b6b82]">
                An administrator reviews every request. Approved requests receive an invitation
                email — your password is never set by anyone but you.
              </p>

              <div>
                <label
                  htmlFor="ar-name"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="ar-name"
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                />
              </div>

              <div>
                <label
                  htmlFor="ar-email"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Work email
                </label>
                <input
                  id="ar-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                />
              </div>

              <div>
                <label
                  htmlFor="ar-reason"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Why do you need access?
                </label>
                <textarea
                  id="ar-reason"
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Joining the SOC Alpha team as a Tier 1 analyst"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4] resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fullName.trim() || !email.trim() || !reason.trim() || submitting}
                  className="px-4 py-2 rounded-md bg-[#aebfe4] text-[#141d2b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Submit request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function EmergencyAccessModal({
  defaultEmail,
  onClose,
}: {
  defaultEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestEmergencyAccess(email.trim(), reason.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not submit your request.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f42]">
          <h2 className="font-bold text-[#e5eaf2]">Request emergency access</h2>
          <button type="button" onClick={onClose} className="text-[#6b7a91] hover:text-[#c3cede]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                If that account exists, an administrator has been notified. Once they approve, sign
                in with your email and password — you won't be asked for a code.
              </p>
              <p className="mt-2 text-xs text-[#5b6b82]">Approval stays valid for 30 minutes.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3 bg-[#1e1a13] border border-orange-900/40 rounded-md p-3">
                <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#a99a84]">
                  Use this only if you can't receive your one-time code. You'll still need your
                  password to sign in.
                </p>
              </div>

              <div>
                <label
                  htmlFor="ea-email"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="ea-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]"
                />
              </div>

              <div>
                <label
                  htmlFor="ea-reason"
                  className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5"
                >
                  Reason
                </label>
                <textarea
                  id="ea-reason"
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I've lost access to my email inbox"
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4] resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || !reason.trim() || submitting}
                  className="px-4 py-2 rounded-md bg-orange-500/90 text-white font-semibold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
