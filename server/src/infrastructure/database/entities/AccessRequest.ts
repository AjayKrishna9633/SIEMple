import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';
import type { AccessRequestStatus } from '../../../domain/entities/AccessRequest';

@Entity({ name: 'access_requests' })
export class AccessRequestEntity {
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Index()
    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', name: 'full_name' })
    fullName!: string;

    @Column({ type: 'text' })
    reason!: string;

    @Index()
    @Column({ type: 'enum', enum: ['pending', 'approved', 'denied'], default: 'pending' })
    status!: AccessRequestStatus;

    @CreateDateColumn({ name: 'requested_at', type: 'timestamptz' })
    requestedAt!: Date;

    @Column({ type: 'timestamptz', name: 'decided_at', nullable: true })
    decidedAt!: Date | null;

    @Column({ type: 'uuid', name: 'decided_by_user_id', nullable: true })
    decidedByUserId!: string | null;
}
