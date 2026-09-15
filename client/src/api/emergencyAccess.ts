import { httpClient } from './httpClient';

export interface PendingEmergencyRequest {
  id: string;
  userEmail: string;
  userName: string;
  reason: string;
  requestedAt: string;
}

export async function listEmergencyRequests(): Promise<PendingEmergencyRequest[]> {
  const { data } = await httpClient.get<PendingEmergencyRequest[]>('/users/emergency-requests');
  return data;
}

export async function decideEmergencyRequest(id: string, approve: boolean): Promise<void> {
  await httpClient.post(`/users/emergency-requests/${id}/decision`, { approve });
}
