import { httpClient } from './httpClient';

export interface SetupStatus {
  isSetupComplete: boolean;
}

export interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
}

export interface CreatedAdmin {
  id: string;
  email: string;
  username: string;
  role: string;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const { data } = await httpClient.get<SetupStatus>('/setup/status');
  return data;
}

export async function createInitialAdmin(payload: CreateAdminPayload): Promise<CreatedAdmin> {
  const { data } = await httpClient.post<CreatedAdmin>('/setup/admin', payload);
  return data;
}
