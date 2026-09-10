import { useState, type FormEvent } from 'react';
import { Terminal, Mail, Info, AlertTriangle } from 'lucide-react';

type Role = 'admin' | 'analyst';

interface ProfileUser {
  fullName: string;
  email: string;
  role: Role;
  team: string;
  accountCreatedAt: string;
  lastLoginAt: string;
  lastSignInIp: string;
}

function daysBeforeNow(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Placeholder until a real login/session system exists — replace with the
// authenticated user fetched from the backend once that's built.
const MOCK_USER: ProfileUser = {
  fullName: 'Alex Mercer',
  email: 'amercer@siemple.local',
  role: 'analyst',
  team: 'SOC Alpha Team',
  accountCreatedAt: daysBeforeNow(196),
  lastLoginAt: daysBeforeNow(2),
  lastSignInIp: '192.168.1.104',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).replace(',', ',') + ' UTC';
}

function daysAgo(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function ProfilePage() {
  const [fullName, setFullName] = useState(MOCK_USER.fullName);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const isAdmin = MOCK_USER.role === 'admin';
  const roleLabel = isAdmin ? 'ADMIN' : 'ANALYST';
  const pageTitle = isAdmin ? 'Administrator Profile' : 'Analyst Profile';
  const roleNote = isAdmin
    ? 'You have full administrative access. Role and permission changes are self-managed.'
    : 'Your role is managed by an administrator. Contact your SOC manager for permission changes.';

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  }

  function handleCancel() {
    setFullName(MOCK_USER.fullName);
    setEmail(MOCK_USER.email);
  }

  return (
    <div className="min-h-screen bg-[#0b111a]">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-[#232f42]">
        <Terminal className="text-[#7e93c4]" size={22} strokeWidth={2} />
        <span className="text-lg font-bold text-[#a9c1f0]">SIEMple</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[#e5eaf2]">{pageTitle}</h1>
        <p className="mt-1 text-sm text-[#8593a8]">Manage personal settings and view session forensic data.</p>
        <div className="mt-6 border-b border-[#232f42]" />

        <div className="mt-8 bg-[#141d2b] border border-[#232f42] rounded-lg p-6 flex gap-5">
          <div className="w-24 h-24 shrink-0 rounded-md bg-[#0a0f1a] border border-[#232f42] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#a9c1f0]">{getInitials(fullName)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-[#e5eaf2]">{fullName}</h2>
              <span className="text-xs font-mono tracking-wide px-2 py-0.5 rounded border border-[#3a4a63] text-[#c3cede]">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8593a8]">{MOCK_USER.team}</p>
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
              <label htmlFor="fullName" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
              />
            </div>

            <div className="mt-5">
              <label htmlFor="email" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7a91]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md pl-11 pr-4 py-2.5 text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
                />
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-400/90">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Changing your email will require re-verification before your next sign-in.
              </p>
            </div>
          </div>

          <div className="bg-[#141d2b] border border-[#232f42] rounded-lg p-6">
            <h3 className="text-base font-bold text-[#e5eaf2] pb-4 border-b border-[#232f42]">Session Audit</h3>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">Account Created</dt>
                <dd className="mt-1 text-sm text-[#c3cede]">{formatDate(MOCK_USER.accountCreatedAt)}</dd>
              </div>
              <div className="pl-3 border-l-2 border-[#7e93c4]">
                <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">Last Login</dt>
                <dd className="mt-1 text-sm text-[#c3cede]">
                  {formatDate(MOCK_USER.lastLoginAt)} ({daysAgo(MOCK_USER.lastLoginAt)} days ago)
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono tracking-wide text-[#6b7a91] uppercase">Last Sign-in IP</dt>
                <dd className="mt-1 text-sm font-mono text-[#c3cede]">
                  {MOCK_USER.lastSignInIp} seen at {formatDate(MOCK_USER.lastLoginAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="md:col-span-3 border-t border-[#232f42] pt-6 flex justify-end items-center gap-3">
            {saveState === 'saved' && <span className="text-sm text-emerald-400 mr-auto">Saved.</span>}
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold hover:bg-[#1a2434]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#3b6fd6] text-white font-semibold hover:bg-[#3563bd]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
