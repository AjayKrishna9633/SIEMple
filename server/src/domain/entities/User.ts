export type UserRole = "admin" | "tier1_analyst" | "tier2_analyst";

export type UserStatus = "active" | "invited" | "disabled";

export interface UserProps {
  id: string;
  email: string;
  passwordHash?: string | null;
  username: string;
  role: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
  inviteTokenHash?: string | null;
  inviteExpiresAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  lastSignInIp?: string | null;
  createdAt?: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  private readonly id: string;
  private email: string;
  private passwordHash: string | null;
  private username: string;
  private role: UserRole;
  private status: UserStatus;
  private isEmailVerified: boolean;
  private inviteTokenHash: string | null;
  private inviteExpiresAt: Date | null;
  private passwordResetTokenHash: string | null;
  private passwordResetExpiresAt: Date | null;
  private lastLoginAt: Date | null;
  private lastSignInIp: string | null;
  private readonly createdAt: Date;

  constructor(props: UserProps) {
    if (!props.id) {
      throw new Error("User id is required");
    }
    if (!EMAIL_REGEX.test(props.email)) {
      throw new Error(`Invalid email: ${props.email}`);
    }
    if (!props.username) {
      throw new Error("User username is required");
    }

    const status = props.status ?? "active";
    // Invited users have no credentials until they accept; anyone else must.
    if (status !== "invited" && !props.passwordHash) {
      throw new Error("User passwordHash is required");
    }

    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash ?? null;
    this.username = props.username;
    this.role = props.role;
    this.status = status;
    this.isEmailVerified = props.isEmailVerified ?? false;
    this.inviteTokenHash = props.inviteTokenHash ?? null;
    this.inviteExpiresAt = props.inviteExpiresAt ?? null;
    this.passwordResetTokenHash = props.passwordResetTokenHash ?? null;
    this.passwordResetExpiresAt = props.passwordResetExpiresAt ?? null;
    this.lastLoginAt = props.lastLoginAt ?? null;
    this.lastSignInIp = props.lastSignInIp ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getPasswordHash(): string | null {
    return this.passwordHash;
  }

  getUsername(): string {
    return this.username;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getIsEmailVerified(): boolean {
    return this.isEmailVerified;
  }

  getInviteTokenHash(): string | null {
    return this.inviteTokenHash;
  }

  getInviteExpiresAt(): Date | null {
    return this.inviteExpiresAt;
  }

  getPasswordResetTokenHash(): string | null {
    return this.passwordResetTokenHash;
  }

  getPasswordResetExpiresAt(): Date | null {
    return this.passwordResetExpiresAt;
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  getLastSignInIp(): string | null {
    return this.lastSignInIp;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /** Only fully onboarded, non-disabled accounts may sign in. */
  canAuthenticate(): boolean {
    return this.status === "active" && this.passwordHash !== null;
  }

  enable(): void {
    if (this.status === "invited") {
      throw new Error("Cannot enable an account that has not accepted its invite");
    }
    this.status = "active";
  }

  disable(): void {
    this.status = "disabled";
  }

  issueInvite(tokenHash: string, expiresAt: Date): void {
    if (this.status !== "invited") {
      throw new Error("Only a pending invite can be reissued");
    }
    this.inviteTokenHash = tokenHash;
    this.inviteExpiresAt = expiresAt;
  }

  isInviteExpired(now: Date = new Date()): boolean {
    return this.inviteExpiresAt === null || now > this.inviteExpiresAt;
  }

  /** Accepting an invite proves control of the mailbox the link was sent to. */
  acceptInvite(passwordHash: string): void {
    if (this.status !== "invited") {
      throw new Error("This invite has already been accepted");
    }
    this.passwordHash = passwordHash;
    this.status = "active";
    this.isEmailVerified = true;
    this.inviteTokenHash = null;
    this.inviteExpiresAt = null;
  }

  rename(username: string): void {
    if (!username) {
      throw new Error("User username is required");
    }
    this.username = username;
  }

  recordLogin(now: Date = new Date(), ipAddress: string | null = null): void {
    this.lastLoginAt = now;
    this.lastSignInIp = ipAddress;
  }

  markEmailVerified(): void {
    this.isEmailVerified = true;
  }

  changePassword(passwordHash: string): void {
    if (!passwordHash) {
      throw new Error("User passwordHash is required");
    }
    this.passwordHash = passwordHash;
  }

  issuePasswordReset(tokenHash: string, expiresAt: Date): void {
    // An invitee has no password to reset, and a disabled account must not be
    // able to let itself back in this way.
    if (!this.canAuthenticate()) {
      throw new Error("This account cannot reset its password");
    }
    this.passwordResetTokenHash = tokenHash;
    this.passwordResetExpiresAt = expiresAt;
  }

  isPasswordResetExpired(now: Date = new Date()): boolean {
    return this.passwordResetExpiresAt === null || now > this.passwordResetExpiresAt;
  }

  /** Clears the token so a reset link cannot be replayed. */
  resetPassword(passwordHash: string): void {
    if (!passwordHash) {
      throw new Error("User passwordHash is required");
    }
    this.passwordHash = passwordHash;
    this.passwordResetTokenHash = null;
    this.passwordResetExpiresAt = null;
  }

  changeRole(role: UserRole): void {
    this.role = role;
  }
}
