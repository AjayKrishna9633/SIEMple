import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ name: 'password_hash' })
    passwordHash!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ type: 'enum', enum: ['admin', 'analyst'] })
    role!: 'admin' | 'analyst';

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'last_login_at', nullable: true })
    lastLoginAt!: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}