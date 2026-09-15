import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import type { UserRole, UserStatus } from '../../../domain/entities/User';

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', name: 'password_hash', nullable: true })
    passwordHash!: string | null;

    // Display name only — email is the identity users authenticate with, so
    // two people are allowed to share a name.
    @Column({ type: 'varchar' })
    username!: string;

    @Column({ type: 'enum', enum: ['admin', 'tier1_analyst', 'tier2_analyst'] })
    role!: UserRole;

    @Column({ type: 'enum', enum: ['active', 'invited', 'disabled'], default: 'active' })
    status!: UserStatus;

    @Column({ type: 'boolean', name: 'is_email_verified', default: false })
    isEmailVerified!: boolean;

    @Index()
    @Column({ type: 'varchar', name: 'invite_token_hash', nullable: true })
    inviteTokenHash!: string | null;

    @Column({ type: 'timestamptz', name: 'invite_expires_at', nullable: true })
    inviteExpiresAt!: Date | null;

    @Index()
    @Column({ type: 'varchar', name: 'password_reset_token_hash', nullable: true })
    passwordResetTokenHash!: string | null;

    @Column({ type: 'timestamptz', name: 'password_reset_expires_at', nullable: true })
    passwordResetExpiresAt!: Date | null;

    @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
    lastLoginAt!: Date | null;

    // Wide enough for IPv6, and for IPv4-mapped forms like ::ffff:192.168.1.104
    @Column({ type: 'varchar', length: 45, name: 'last_sign_in_ip', nullable: true })
    lastSignInIp!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}
