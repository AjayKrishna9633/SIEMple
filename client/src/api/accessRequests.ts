import { httpClient } from './httpClient';
import type { UserRole } from './users';

export interface PendingAccessRequest {
  id: string;
  email: string;
  fullName: string;
  reason: string;
  requestedAt: string;
}

export async function requestAccess(payload: {
  email: string;
  fullName: string;
  reason: string;
}): Promise<void> {
  await httpClient.post('/auth/access-request', payload);
}

export async function listAccessRequests(): Promise<PendingAccessRequest[]> {
  const { data } = await httpClient.get<PendingAccessRequest[]>('/users/access-requests');
  return data;
}

export async function decideAccessRequest(
  id: string,
  approve: boolean,
  role?: UserRole,
): Promise<void> {
  await httpClient.post(`/users/access-requests/${id}/decision`, { approve, role });
}
