import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  UserPlus,
  Search,
  Pencil,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Mail,
  AlertTriangle,
  Send,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import {
  listUsers,
  getUserStats,
  inviteUser,
  updateUser,
  setUserStatus,
  resendInvite,
  ROLE_LABELS,
  STATUS_LABELS,
  type ManagedUser,
  type UserRole,
  type UserStatus,
  type UserStats,
  type UserSortField,
  type SortDirection,
} from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/errors';
import {
  listEmergencyRequests,
  decideEmergencyRequest,
  type PendingEmergencyRequest,
} from '../api/emergencyAccess';
import {
  listAccessRequests,
  decideAccessRequest,
  type PendingAccessRequest,
} from '../api/accessRequests';

const ROLE_OPTIONS: UserRole[] = ['admin', 'tier1_analyst', 'tier2_analyst'];
const STATUS_OPTIONS: UserStatus[] = ['active', 'invited', 'disabled'];

const STATUS_DOT: Record<UserStatus, string> = {
  active: 'bg-emerald-400',
  invited: 'bg-blue-400',
  disabled: 'bg-[#5b6b82]',
};

function formatLastLogin(iso: string | null): string {
  if (!iso) return '–';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}Z`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function SortableHeader({
  field,
  label,
  sortBy,
  sortDirection,
  onSort,
}: {
  field: UserSortField;
  label: string;
  sortBy: UserSortField;
  sortDirection: SortDirection;
  onSort: (field: UserSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th className="px-6 py-3 font-normal">
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`flex items-center gap-1.5 uppercase tracking-[0.1em] ${
          active ? 'text-[#c3cede]' : 'text-[#6b7a91] hover:text-[#8593a8]'
        }`}
      >
        {label}
        {active ? (
          sortDirection === 'asc' ? (
            <ArrowUp size={13} />
          ) : (
            <ArrowDown size={13} />
          )
        ) : (
          <ChevronsUpDown size={13} className="text-[#3a4a63]" />
        )}
      </button>
    </th>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex-1 bg-[#141d2b] border border-[#232f42] rounded-lg px-6 py-5">
      <p className="text-xs font-mono tracking-[0.15em] text-[#6b7a91] uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#e5eaf2]">{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#141d2b] border border-[#232f42] rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f42]">
          <h2 className="font-bold text-[#e5eaf2]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#6b7a91] hover:text-[#c3cede]">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] placeholder:text-[#4d5a70] focus:outline-none focus:border-[#7e93c4]';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [sortBy, setSortBy] = useState<UserSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [confirming, setConfirming] = useState<ManagedUser | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<PendingEmergencyRequest[]>([]);
  const [accessRequests, setAccessRequests] = useState<PendingAccessRequest[]>([]);
  const [approveRoles, setApproveRoles] = useState<Record<string, UserRole>>({});
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, nextStats, pending, access] = await Promise.all([
        listUsers({
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          sortBy,
          sortDirection,
          page,
        }),
        getUserStats(),
        listEmergencyRequests(),
        listAccessRequests(),
      ]);
      setUsers(list.users);
      setTotal(list.total);
      setPageSize(list.pageSize);
      setStats(nextStats);
      setEmergencyRequests(pending);
      setAccessRequests(access);
    } catch (err) {
      setError(errorMessage(err, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, sortBy, sortDirection, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // First click on a column sorts it; clicking the active column flips it.
  function handleSort(field: UserSortField) {
    if (field === sortBy) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection(field === 'lastLoginAt' ? 'desc' : 'asc');
    }
    setPage(1);
  }

  const sortProps = { sortBy, sortDirection, onSort: handleSort };

  function handleToggleStatus(target: ManagedUser) {
    setConfirming(target);
  }

  async function handleResendInvite(target: ManagedUser) {
    setResendingId(target.id);
    setError(null);
    setNotice(null);
    try {
      await resendInvite(target.id);
      setNotice(`A new invitation has been sent to ${target.email}. Any earlier link is now void.`);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not resend that invitation.'));
    } finally {
      setResendingId(null);
    }
  }

  async function handleAccessDecision(requestId: string, approve: boolean) {
    setDecidingId(requestId);
    setError(null);
    try {
      await decideAccessRequest(requestId, approve, approveRoles[requestId] ?? 'tier1_analyst');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not record that decision.'));
    } finally {
      setDecidingId(null);
    }
  }

  async function handleDecision(requestId: string, approve: boolean) {
    setDecidingId(requestId);
    setError(null);
    try {
      await decideEmergencyRequest(requestId, approve);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not record that decision.'));
    } finally {
      setDecidingId(null);
    }
  }

  async function confirmStatusChange() {
    if (!confirming) return;
    const enabling = confirming.status === 'disabled';
    setConfirmSubmitting(true);
    setError(null);
    try {
      await setUserStatus(confirming.id, enabling);
      setConfirming(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not update that account.'));
      setConfirming(null);
    } finally {
      setConfirmSubmitting(false);
    }
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="px-8 py-8">
      <p className="text-xs font-mono tracking-[0.15em] text-[#6b7a91] uppercase">
        Settings / User Management
      </p>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#e5eaf2]">User Management</h1>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 bg-[#aebfe4] text-[#141d2b] font-semibold px-4 py-2.5 rounded-md hover:bg-[#c3cede]"
        >
          <UserPlus size={18} />
          Invite user
        </button>
      </div>

      <div className="mt-6 flex gap-6">
        <StatCard label="Total Users" value={stats?.total ?? '—'} />
        <StatCard label="Pending Invites" value={stats?.invited ?? '—'} />
        <StatCard label="Disabled Accounts" value={stats?.disabled ?? '—'} />
      </div>

      {accessRequests.length > 0 && (
        <div className="mt-6 bg-[#101a2b] border border-[#2a4266] rounded-lg">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2a4266]">
            <UserPlus size={16} className="text-[#7e93c4]" />
            <h2 className="text-sm font-bold text-[#a9c1f0]">
              Access requests ({accessRequests.length})
            </h2>
          </div>
          <ul>
            {accessRequests.map((request) => (
              <li
                key={request.id}
                className="flex items-start gap-4 px-6 py-4 border-t border-[#2a4266]/50 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#e5eaf2]">
                    {request.fullName}{' '}
                    <span className="font-normal text-[#8593a8]">({request.email})</span>
                  </p>
                  <p className="mt-1 text-sm text-[#8593a8]">{request.reason}</p>
                  <p className="mt-1 text-xs font-mono text-[#6b7a91]">
                    Requested {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={approveRoles[request.id] ?? 'tier1_analyst'}
                    onChange={(e) =>
                      setApproveRoles((prev) => ({
                        ...prev,
                        [request.id]: e.target.value as UserRole,
                      }))
                    }
                    className="bg-[#0a0f1a] border border-[#232f42] rounded-md px-2 py-1.5 text-xs text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAccessDecision(request.id, false)}
                    disabled={decidingId === request.id}
                    className="px-3 py-1.5 rounded-md border border-[#3a4a63] text-sm text-[#c3cede] font-semibold disabled:opacity-40"
                  >
                    Deny
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessDecision(request.id, true)}
                    disabled={decidingId === request.id}
                    className="px-3 py-1.5 rounded-md bg-[#aebfe4] text-sm text-[#141d2b] font-semibold hover:bg-[#c3cede] disabled:opacity-40"
                  >
                    {decidingId === request.id ? 'Saving…' : 'Approve & invite'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="px-6 py-3 border-t border-[#2a4266]/60 text-xs text-[#6b7a91]">
            Approving sends an invitation email — the person sets their own password. No account
            exists until they accept.
          </p>
        </div>
      )}

      {/* Kept visible when empty so the capability is discoverable, and so
          "none pending" is distinguishable from "this is broken". */}
      {emergencyRequests.length === 0 ? (
        <div className="mt-6 flex items-center gap-2 bg-[#141d2b] border border-[#232f42] rounded-lg px-6 py-4">
          <AlertTriangle size={15} className="text-[#5b6b82]" />
          <p className="text-sm text-[#6b7a91]">No pending emergency access requests.</p>
        </div>
      ) : (
        <div className="mt-6 bg-[#1a1410] border border-orange-900/50 rounded-lg">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-orange-900/40">
            <AlertTriangle size={16} className="text-orange-400" />
            <h2 className="text-sm font-bold text-orange-300">
              Emergency access requests ({emergencyRequests.length})
            </h2>
          </div>
          <ul>
            {emergencyRequests.map((request) => (
              <li
                key={request.id}
                className="flex items-start gap-4 px-6 py-4 border-t border-orange-900/20 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#e5eaf2]">
                    {request.userName}{' '}
                    <span className="font-normal text-[#8593a8]">({request.userEmail})</span>
                  </p>
                  <p className="mt-1 text-sm text-[#a99a84]">{request.reason}</p>
                  <p className="mt-1 text-xs font-mono text-[#6b7a91]">
                    Requested {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, false)}
                    disabled={decidingId === request.id}
                    className="px-3 py-1.5 rounded-md border border-[#3a4a63] text-sm text-[#c3cede] font-semibold disabled:opacity-40"
                  >
                    Deny
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, true)}
                    disabled={decidingId === request.id}
                    className="px-3 py-1.5 rounded-md bg-orange-500/90 text-sm text-white font-semibold hover:bg-orange-500 disabled:opacity-40"
                  >
                    {decidingId === request.id ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="px-6 py-3 border-t border-orange-900/30 text-xs text-[#6b7a91]">
            Approving lets them sign in with their password only, skipping the emailed code, for 30
            minutes. It does not reveal or reset their password.
          </p>
        </div>
      )}

      <div className="mt-6 bg-[#141d2b] border border-[#232f42] rounded-lg">
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-[#232f42]">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6b82]" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="FILTER BY NAME OR EMAIL..."
              className={`${inputClass} pl-9 font-mono text-xs tracking-wide`}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-mono tracking-wide text-[#8593a8] uppercase">
            Role:
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setPage(1);
              }}
              className="bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono tracking-wide text-[#8593a8] uppercase">
            Status:
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | '');
                setPage(1);
              }}
              className="bg-[#0a0f1a] border border-[#232f42] rounded-md px-3 py-2 text-sm text-[#e5eaf2] focus:outline-none focus:border-[#7e93c4]"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-3 font-mono text-xs text-[#8593a8]">
            <span>
              {rangeStart}-{rangeEnd} of {total}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-[#8593a8] disabled:text-[#3a4a63] disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="text-[#8593a8] disabled:text-[#3a4a63] disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {error && <p className="px-6 py-3 text-sm text-red-400 border-b border-[#232f42]">{error}</p>}
        {notice && (
          <p className="px-6 py-3 text-sm text-emerald-400 border-b border-[#232f42]">{notice}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-xs tracking-[0.1em] text-[#6b7a91] uppercase">
                <SortableHeader field="username" label="User" {...sortProps} />
                <SortableHeader field="role" label="Role" {...sortProps} />
                <th className="px-6 py-3 font-normal">Source</th>
                <SortableHeader field="status" label="Status" {...sortProps} />
                <SortableHeader field="lastLoginAt" label="Last Login" {...sortProps} />
                <th className="px-6 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#8593a8]">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#8593a8]">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isInvited = u.status === 'invited';
                  return (
                    <tr key={u.id} className="border-t border-[#1d2738]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-[#0a0f1a] border border-[#232f42] flex items-center justify-center text-xs font-bold text-[#a9c1f0]">
                            {isInvited ? <Mail size={15} className="text-[#5b6b82]" /> : initials(u.username)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#e5eaf2] truncate">{u.username}</p>
                            <p className="text-xs text-[#6b7a91] truncate">
                              {isInvited ? 'Awaiting first login' : u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block font-mono text-[11px] tracking-wide px-2 py-1 rounded border border-[#3a4a63] text-[#c3cede]">
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[#8593a8]">
                          <Monitor size={14} />
                          Local
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 ${
                            u.status === 'disabled' ? 'text-[#5b6b82]' : 'text-[#e5eaf2]'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[u.status]}`} />
                          {STATUS_LABELS[u.status]}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 font-mono text-xs ${
                          u.status === 'disabled' ? 'text-[#5b6b82]' : 'text-[#c3cede]'
                        }`}
                      >
                        {formatLastLogin(u.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {isInvited && (
                            <button
                              type="button"
                              onClick={() => handleResendInvite(u)}
                              disabled={resendingId === u.id}
                              title="Send a fresh invitation link — the previous one stops working"
                              className="text-[#6b7a91] hover:text-[#c3cede] disabled:text-[#2f3b4f] disabled:cursor-not-allowed"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing(u)}
                            title="Edit user"
                            className="text-[#6b7a91] hover:text-[#c3cede]"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf || isInvited}
                            title={
                              isSelf
                                ? "You can't disable your own account"
                                : isInvited
                                  ? 'This invite has not been accepted yet'
                                  : u.status === 'disabled'
                                    ? 'Enable account'
                                    : 'Disable account'
                            }
                            className="text-[#6b7a91] hover:text-[#c3cede] disabled:text-[#2f3b4f] disabled:cursor-not-allowed"
                          >
                            {u.status === 'disabled' ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvited={async () => {
            setInviteOpen(false);
            await load();
          }}
        />
      )}

      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      {confirming && (
        <StatusChangeModal
          user={confirming}
          submitting={confirmSubmitting}
          onCancel={() => setConfirming(null)}
          onConfirm={confirmStatusChange}
        />
      )}
    </div>
  );
}

function StatusChangeModal({
  user,
  submitting,
  onCancel,
  onConfirm,
}: {
  user: ManagedUser;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const enabling = user.status === 'disabled';

  return (
    <Modal title={enabling ? 'Activate account' : 'Block account'} onClose={onCancel}>
      <div className="flex gap-3">
        {enabling ? (
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <Ban size={20} className="text-red-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm text-[#e5eaf2]">
            {enabling ? 'Activate' : 'Block'} <span className="font-semibold">{user.username}</span>?
          </p>
          <p className="mt-2 text-sm text-[#8593a8]">
            {enabling
              ? "They'll be able to sign in again immediately, with their previous role and history intact."
              : "They'll be signed out immediately and won't be able to sign in until you re-enable the account. Nothing is deleted — their history and audit trail are kept."}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className={`px-4 py-2 rounded-md text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
            enabling ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-500/90 hover:bg-red-500'
          }`}
        >
          {submitting
            ? enabling
              ? 'Activating…'
              : 'Blocking…'
            : enabling
              ? 'Activate account'
              : 'Block account'}
        </button>
      </div>
    </Modal>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('tier1_analyst');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await inviteUser({ email: email.trim(), role });
      onInvited();
    } catch (err) {
      setError(errorMessage(err, 'Could not send the invitation.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Invite user" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invite-email" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@organization.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputClass}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-[#5b6b82]">
          They'll get an email with a link to set their own password. The link expires in 7 days.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!email || submitting}
            className="px-4 py-2 rounded-md bg-[#aebfe4] text-[#141d2b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: ManagedUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState<UserRole>(user.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateUser(user.id, { username: username.trim(), role });
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save those changes.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Edit ${user.email}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
            Display name
          </label>
          <input
            id="edit-name"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-role" className="block text-xs font-mono tracking-wide text-[#8593a8] uppercase mb-1.5">
            Role
          </label>
          <select
            id="edit-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputClass}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#3a4a63] text-[#c3cede] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-[#aebfe4] text-[#141d2b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
