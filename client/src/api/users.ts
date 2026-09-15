import { httpClient } from './httpClient';

export type UserRole = 'admin' | 'tier1_analyst' | 'tier2_analyst';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface ManagedUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type UserSortField = 'username' | 'role' | 'status' | 'lastLoginAt' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface UserListResponse {
  users: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: UserSortField;
  sortDirection: SortDirection;
}

export interface UserStats {
  total: number;
  invited: number;
  disabled: number;
}

export interface ListUsersParams {
  search?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
  page?: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'ADMINISTRATOR',
  tier1_analyst: 'TIER 1 ANALYST',
  tier2_analyst: 'TIER 2 ANALYST',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  disabled: 'Disabled',
};

export async function listUsers(params: ListUsersParams): Promise<UserListResponse> {
  const { data } = await httpClient.get<UserListResponse>('/users', {
    params: {
      search: params.search || undefined,
      role: params.role || undefined,
      status: params.status || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      page: params.page,
    },
  });
  return data;
}

export async function getUserStats(): Promise<UserStats> {
  const { data } = await httpClient.get<UserStats>('/users/stats');
  return data;
}

export async function inviteUser(payload: { email: string; role: UserRole }): Promise<ManagedUser> {
  const { data } = await httpClient.post<ManagedUser>('/users/invite', payload);
  return data;
}

export async function updateUser(
  id: string,
  payload: { username?: string; role?: UserRole },
): Promise<ManagedUser> {
  const { data } = await httpClient.patch<ManagedUser>(`/users/${id}`, payload);
  return data;
}

export async function resendInvite(id: string): Promise<ManagedUser> {
  const { data } = await httpClient.post<ManagedUser>(`/users/${id}/resend-invite`);
  return data;
}

export async function setUserStatus(id: string, enabled: boolean): Promise<ManagedUser> {
  const { data } = await httpClient.post<ManagedUser>(`/users/${id}/status`, { enabled });
  return data;
}
