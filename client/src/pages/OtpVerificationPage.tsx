import { useEffect, useState, type FormEvent } from 'react';
import { Shield, MailCheck, AlertCircle } from 'lucide-react';
import { verifyOtp, verifyEmail, resendOtp, type AuthenticatedUser } from '../api/auth';

export type OtpPurpose = 'login' | 'email-verification';

export interface OtpVerificationPageProps {
  challengeId: string;
  purpose: OtpPurpose;
  email?: string;
  onVerified: (user: AuthenticatedUser) => void;
  onBack?: () => void;
}

// Mirrors the server's OTP_RESEND_COOLDOWN_MS default; the server rejects
// early resends regardless, this just avoids a pointless round trip.
const RESEND_COOLDOWN_SECONDS = 60;

const COPY: Record<OtpPurpose, { heading: string; blurb: string; submit: string }> = {
  'email-verification': {
    heading: 'Verify Your Email',
    blurb: 'Enter the verification code we sent to',
    submit: 'Verify Email',
  },
  login: {
    heading: 'Enter One-Time Code',
    blurb: 'Enter the sign-in code we sent to',
    submit: 'Verify',
  },
};

function errorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message ?? fallback;
}

export default function OtpVerificationPage({
  challengeId,
  purpose,
  email,
  onVerified,
  onBack,
}: OtpVerificationPageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const copy = COPY[purpose];

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    setNotice(null);
    try {
      const verify = purpose === 'login' ? verifyOtp : verifyEmail;
      const user = await verify({ challengeId, code });
      onVerified(user);
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code'));
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      await resendOtp(challengeId);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setNotice('A new code is on its way.');
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the code. Please try again.'));
    } finally {
      setResending(false);
    }
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
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-[#0a0f1a] border border-[#232f42] flex items-center justify-center">
              <MailCheck className="text-[#7e93c4]" size={26} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-[#e5eaf2]">{copy.heading}</h2>
          <p className="mt-1 text-sm text-center text-[#8593a8]">
            {copy.blurb}{' '}
            {email ? <span className="text-[#c3cede]">{email}</span> : 'your email'}.
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className={`w-full bg-[#0a0f1a] border rounded-md px-4 py-2.5 text-center text-lg tracking-[0.4em] text-[#e5eaf2] placeholder:tracking-normal placeholder:text-[#4d5a70] focus:outline-none ${
                error ? 'border-red-500' : 'border-[#232f42] focus:border-[#7e93c4]'
              }`}
            />

            {error && (
              <p className="flex items-center justify-center gap-1.5 text-sm text-red-400">
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {notice && <p className="text-sm text-center text-emerald-400">{notice}</p>}

            <button
              type="submit"
              disabled={code.length !== 6 || verifying}
              className="w-full bg-[#7e93c4] text-[#141d2b] font-bold py-3 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying…' : copy.submit}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-sm text-[#7e93c4] disabled:text-[#5b6b82] disabled:cursor-not-allowed"
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Didn't get it? Resend code"}
            </button>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 w-full text-sm text-[#8593a8] hover:text-[#c3cede]"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
