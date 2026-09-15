import { In, Repository } from 'typeorm';
import { EmergencyAccessRequest } from '../../domain/entities/EmergencyAccessRequest';
import {
    EmergencyAccessRequestRepository,
    PendingEmergencyRequest,
} from '../../domain/repositories/EmergencyAccessRequestRepository';
import { EmergencyAccessRequestEntity } from '../database/entities/EmergencyAccessRequest';
import { UserEntity } from '../database/entities/User';

export class TypeOrmEmergencyAccessRequestRepository implements EmergencyAccessRequestRepository {
    constructor(
        private readonly repo: Repository<EmergencyAccessRequestEntity>,
        private readonly users: Repository<UserEntity>,
    ) {}

    async save(request: EmergencyAccessRequest): Promise<void> {
        await this.repo.save(
            this.repo.create({
                id: request.getId(),
                userId: request.getUserId(),
                reason: request.getReason(),
                status: request.getStatus(),
                decidedAt: request.getDecidedAt(),
                decidedByUserId: request.getDecidedByUserId(),
                grantExpiresAt: request.getGrantExpiresAt(),
            }),
        );
    }

    async findById(id: string): Promise<EmergencyAccessRequest | null> {
        const row = await this.repo.findOneBy({ id });
        return row ? this.toDomain(row) : null;
    }

    async findPendingByUserId(userId: string): Promise<EmergencyAccessRequest | null> {
        const row = await this.repo.findOneBy({ userId, status: 'pending' });
        return row ? this.toDomain(row) : null;
    }

    async findUsableGrant(userId: string, now: Date): Promise<EmergencyAccessRequest | null> {
        const row = await this.repo
            .createQueryBuilder('r')
            .where('r.user_id = :userId', { userId })
            .andWhere('r.status = :status', { status: 'approved' })
            .andWhere('r.grant_expires_at >= :now', { now })
            .orderBy('r.grant_expires_at', 'DESC')
            .getOne();
        return row ? this.toDomain(row) : null;
    }

    async listPending(): Promise<PendingEmergencyRequest[]> {
        const rows = await this.repo.find({
            where: { status: 'pending' },
            order: { requestedAt: 'ASC' },
        });
        if (rows.length === 0) return [];

        const users = await this.users.findBy({ id: In(rows.map((row) => row.userId)) });
        const byId = new Map(users.map((user) => [user.id, user]));

        return rows.map((row) => ({
            request: this.toDomain(row),
            userEmail: byId.get(row.userId)?.email ?? 'unknown',
            userName: byId.get(row.userId)?.username ?? 'unknown',
        }));
    }

    private toDomain(row: EmergencyAccessRequestEntity): EmergencyAccessRequest {
        return new EmergencyAccessRequest({
            id: row.id,
            userId: row.userId,
            reason: row.reason,
            status: row.status,
            requestedAt: row.requestedAt,
            decidedAt: row.decidedAt,
            decidedByUserId: row.decidedByUserId,
            grantExpiresAt: row.grantExpiresAt,
        });
    }
}
