import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';
import { checkPasswordResetToken, submitPasswordReset } from '../api/auth';
import { errorMessage } from '../api/errors';
import { getPasswordError, PASSWORD_HINT } from '../lib/passwordPolicy';

type Stage = 'checking' | 'invalid' | 'form' | 'done';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [stage, setStage] = useState<Stage>('checking');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError('This reset link is missing its token.');
      setStage('invalid');
      return;
    }
    checkPasswordResetToken(token)
      .then(() => setStage('form'))
      .catch((err) => {
        setTokenError(errorMessage(err, 'This password reset link is invalid or has expired.'));
        setStage('invalid');
      });
  }, [token]);

  const policyError = password ? getPasswordError(password) : null;
  const confirmError =
    confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : null;
  const canSubmit =
    password.length > 0 && confirmPassword.length > 0 && !policyError && !confirmError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitPasswordReset(token, password);
      setStage('done');
    } catch (err) {
      setError(errorMessage(err, 'Could not reset your password.'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]';

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
            <p className="text-center text-sm text-[#8593a8]">Checking your reset link…</p>
          )}

          {stage === 'invalid' && (
            <div className="text-center">
              <AlertCircle className="mx-auto text-red-400" size={28} />
              <p className="mt-3 text-sm text-[#8593a8]">{tokenError}</p>
              <p className="mt-2 text-xs text-[#5b6b82]">
                Reset links expire after an hour and can only be used once. Request a new one from
                the sign-in page.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-5 w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {stage === 'form' && (
            <>
              <div className="text-center space-y-2 mb-6">
                <KeyRound className="mx-auto text-[#7e93c4]" size={26} />
                <h2 className="text-lg font-bold text-[#e5eaf2]">Choose a New Password</h2>
                <p className="text-sm text-[#8593a8]">
                  Pick something you haven't used here before.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-mono text-[#c3cede] mb-1.5">
                    New password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
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
                  <p className={`mt-1.5 text-xs ${policyError ? 'text-red-400' : 'text-[#5b6b82]'}`}>
                    {policyError ?? PASSWORD_HINT}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-mono text-[#c3cede] mb-1.5"
                  >
                    Confirm new password *
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                  {confirmError && <p className="mt-1.5 text-xs text-red-400">{confirmError}</p>}
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center">
              <p className="text-sm text-[#8593a8]">
                Your password has been reset. You can now sign in with your new password.
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
