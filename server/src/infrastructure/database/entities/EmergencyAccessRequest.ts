import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';
import type { EmergencyAccessStatus } from '../../../domain/entities/EmergencyAccessRequest';

@Entity({ name: 'emergency_access_requests' })
export class EmergencyAccessRequestEntity {
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @Column({ type: 'text' })
    reason!: string;

    @Index()
    @Column({ type: 'enum', enum: ['pending', 'approved', 'denied', 'used'], default: 'pending' })
    status!: EmergencyAccessStatus;

    @CreateDateColumn({ name: 'requested_at', type: 'timestamptz' })
    requestedAt!: Date;

    @Column({ type: 'timestamptz', name: 'decided_at', nullable: true })
    decidedAt!: Date | null;

    @Column({ type: 'uuid', name: 'decided_by_user_id', nullable: true })
    decidedByUserId!: string | null;

    @Column({ type: 'timestamptz', name: 'grant_expires_at', nullable: true })
    grantExpiresAt!: Date | null;
}
