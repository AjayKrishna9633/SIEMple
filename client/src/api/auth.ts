import { httpClient } from './httpClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  challengeId: string;
}

export interface VerifyOtpPayload {
  challengeId: string;
  code: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await httpClient.post<LoginResult>('/auth/login', payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthenticatedUser> {
  const { data } = await httpClient.post<AuthenticatedUser>('/auth/verify-otp', payload);
  return data;
}

export async function verifyEmail(payload: VerifyOtpPayload): Promise<AuthenticatedUser> {
  const { data } = await httpClient.post<AuthenticatedUser>('/auth/verify-email', payload);
  return data;
}

export async function resendOtp(challengeId: string): Promise<{ retryAfterMs: number }> {
  const { data } = await httpClient.post<{ retryAfterMs: number }>('/auth/resend-otp', { challengeId });
  return data;
}
