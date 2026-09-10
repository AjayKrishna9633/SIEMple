import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', name: 'password_hash' })
    passwordHash!: string;

    @Column({ type: 'varchar', unique: true })
    username!: string;

    @Column({ type: 'enum', enum: ['admin', 'analyst'] })
    role!: 'admin' | 'analyst';

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ type: 'boolean', name: 'is_email_verified', default: false })
    isEmailVerified!: boolean;

    @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
    lastLoginAt!: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}
