import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  TerminalSquare,
  Search,
  Bell,
  Shield,
  LayoutGrid,
  AlertTriangle,
  Crosshair,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Share2,
  Fingerprint,
  Zap,
  Settings,
  History,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// Only User Management and Profile exist so far; the rest mirror the mockup's
// rail and are intentionally inert until those screens are built.
const NAV_SECTIONS = [
  {
    label: 'Monitoring',
    items: [
      { icon: LayoutGrid, label: 'Dashboard', to: null },
      { icon: AlertTriangle, label: 'Alerts', to: null },
      { icon: ClipboardCheck, label: 'Cases', to: null },
    ],
  },
  {
    label: 'Domains',
    items: [
      { icon: Crosshair, label: 'Threat Hunting', to: null },
      { icon: ShieldCheck, label: 'Detections', to: null },
      { icon: Share2, label: 'Network', to: null },
      { icon: Fingerprint, label: 'Endpoints', to: null },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Users, label: 'User Management', to: '/settings/users' },
      { icon: Zap, label: 'Automation', to: null },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Settings, label: 'Settings', to: null },
      { icon: History, label: 'Audit Log', to: null },
    ],
  },
] as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0b111a] text-[#e5eaf2]">
      <header className="flex items-center gap-6 px-6 py-3 border-b border-[#232f42]">
        <div className="flex items-center gap-2.5 shrink-0">
          <TerminalSquare className="text-[#7e93c4]" size={22} strokeWidth={2} />
          <span className="text-lg font-bold text-[#a9c1f0]">SIEMple</span>
        </div>

        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b82]" />
          <input
            type="search"
            disabled
            placeholder="Search queries, IPs..."
            title="Search isn't wired up yet"
            className="w-full bg-[#0a0f1a] border border-[#232f42] rounded-md pl-10 pr-4 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] disabled:cursor-not-allowed"
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            disabled
            title="Notifications aren't wired up yet"
            className="relative text-[#6b7a91] disabled:cursor-not-allowed"
          >
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-[#232f42]">
            <NavLink
              to="/profile"
              title={user ? `${user.username} — view profile` : 'Profile'}
              className="w-8 h-8 rounded-full bg-[#1a2434] border border-[#3a4a63] flex items-center justify-center text-xs font-bold text-[#a9c1f0] hover:border-[#7e93c4]"
            >
              {user ? initials(user.username) : '—'}
            </NavLink>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-[#8593a8] hover:text-[#c3cede]"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-20 shrink-0 border-r border-[#232f42] min-h-[calc(100vh-57px)] py-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-md bg-[#1a2434] border border-[#3a4a63] flex items-center justify-center mb-5">
              <Shield className="text-[#7e93c4]" size={20} />
            </div>

            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="w-full flex flex-col items-center mb-5">
                <p className="w-full px-2 mb-2 text-[9px] font-mono leading-tight tracking-[0.15em] text-[#4d5a70] uppercase text-center">
                  {section.label}
                </p>
                {section.items.map(({ icon: Icon, label, to }) =>
                  to ? (
                    <NavLink
                      key={label}
                      to={to}
                      title={label}
                      className={({ isActive }) =>
                        `w-10 h-10 rounded-md flex items-center justify-center ${
                          isActive
                            ? 'bg-[#1a2434] text-[#a9c1f0] border-l-2 border-[#7e93c4]'
                            : 'text-[#5b6b82] hover:text-[#8593a8]'
                        }`
                      }
                    >
                      <Icon size={20} />
                    </NavLink>
                  ) : (
                    <span
                      key={label}
                      title={`${label} isn't built yet`}
                      className="w-10 h-10 rounded-md flex items-center justify-center text-[#3a4a63] cursor-not-allowed"
                    >
                      <Icon size={20} />
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
