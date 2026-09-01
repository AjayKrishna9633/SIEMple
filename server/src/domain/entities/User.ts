export type UserRole = "admin" | "analyst";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  role: UserRole;
  isActive?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  private readonly id: string;
  private email: string;
  private passwordHash: string;
  private username: string;
  private role: UserRole;
  private isActive: boolean;
  private lastLoginAt: Date | null;
  private readonly createdAt: Date;

  constructor(props: UserProps) {
    if (!props.id) {
      throw new Error("User id is required");
    }
    if (!EMAIL_REGEX.test(props.email)) {
      throw new Error(`Invalid email: ${props.email}`);
    }
    if (!props.passwordHash) {
      throw new Error("User passwordHash is required");
    }
    if (!props.username) {
      throw new Error("User username is required");
    }

    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.username = props.username;
    this.role = props.role;
    this.isActive = props.isActive ?? true;
    this.lastLoginAt = props.lastLoginAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getUsername(): string {
    return this.username;
  }

  getRole(): UserRole {
    return this.role;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
  }

  changeRole(role: UserRole): void {
    this.role = role;
  }
}
