import { httpClient } from './httpClient';

export interface LoginPayload {
  email: string;
  password: string;
}

/** Login returns a challenge id normally, or a session when an emergency grant was used. */
export type LoginResult =
  | { challengeId: string; emergencyAccess?: undefined }
  | { emergencyAccess: true; user: AuthenticatedUser };

export interface VerifyOtpPayload {
  challengeId: string;
  code: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'tier1_analyst' | 'tier2_analyst';
  status: 'active' | 'invited' | 'disabled';
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  lastSignInIp: string | null;
  createdAt: string;
}

export interface InvitePreview {
  maskedEmail: string;
  role: string;
}

export interface AcceptInvitePayload {
  token: string;
  email: string;
  username: string;
  password: string;
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

export async function requestEmergencyAccess(email: string, reason: string): Promise<void> {
  await httpClient.post('/auth/emergency-access', { email, reason });
}

export async function getMe(): Promise<AuthenticatedUser> {
  const { data } = await httpClient.get<AuthenticatedUser>('/auth/me');
  return data;
}

export async function updateMyProfile(username: string): Promise<AuthenticatedUser> {
  const { data } = await httpClient.patch<AuthenticatedUser>('/auth/me', { username });
  return data;
}

export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await httpClient.post('/auth/me/password', { currentPassword, newPassword });
}

export async function forgotPassword(email: string): Promise<void> {
  await httpClient.post('/auth/forgot-password', { email });
}

export async function checkPasswordResetToken(token: string): Promise<void> {
  await httpClient.get('/auth/password-reset', { params: { token } });
}

export async function submitPasswordReset(token: string, newPassword: string): Promise<void> {
  await httpClient.post('/auth/reset-password', { token, newPassword });
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}

export async function previewInvite(token: string): Promise<InvitePreview> {
  const { data } = await httpClient.get<InvitePreview>('/auth/invite', { params: { token } });
  return data;
}

export async function acceptInvite(payload: AcceptInvitePayload): Promise<AuthenticatedUser> {
  const { data } = await httpClient.post<AuthenticatedUser>('/auth/accept-invite', payload);
  return data;
}
