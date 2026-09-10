import { useState, type FormEvent } from 'react';
import { Shield, LayoutGrid, Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { login, type AuthenticatedUser } from '../api/auth';
import OtpVerificationPage from './OtpVerificationPage';

type Step = 'credentials' | 'otp' | 'success';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const [challengeId, setChallengeId] = useState('');

  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthenticating(true);
    setLoginError(null);
    try {
      const result = await login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch {
      setLoginError('Invalid credentials');
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
          setAuthenticatedUser(user);
          setStep('success');
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

              <button
                type="button"
                disabled
                title="Azure AD sign-in isn't available yet"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#1a2434] text-[#dbe4f5] py-3 rounded-md font-semibold opacity-60 cursor-not-allowed"
              >
                <LayoutGrid size={18} />
                Sign in with Azure AD
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-[#232f42]" />
                <span className="text-xs font-mono text-[#5b6b82]">OR LOCAL</span>
                <div className="h-px flex-1 bg-[#232f42]" />
              </div>

              <p className="text-sm text-center text-[#8593a8] mb-4">Local sign-in requires a one-time code</p>

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
                  <span
                    className="text-sm text-[#5b6b82] cursor-not-allowed"
                    title="Passphrase recovery isn't available yet"
                  >
                    Forgot passphrase?
                  </span>
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
                disabled
                title="Emergency access isn't available yet"
                className="mt-6 w-full flex items-center justify-center gap-2 border border-orange-900/50 text-orange-400/70 py-2.5 rounded-md text-xs font-mono tracking-wide uppercase opacity-70 cursor-not-allowed"
              >
                <AlertTriangle size={14} />
                Request Emergency Access
              </button>
            </>
          )}

          {step === 'success' && authenticatedUser && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#e5eaf2]">Access Granted</h2>
              <p className="mt-2 text-sm text-[#8593a8]">
                Signed in as {authenticatedUser.username} ({authenticatedUser.role}).
              </p>
              <p className="mt-1 text-xs text-[#5b6b82]">No dashboard exists yet to redirect to.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
