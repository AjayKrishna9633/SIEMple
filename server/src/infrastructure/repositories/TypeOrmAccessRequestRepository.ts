import { Repository } from 'typeorm';
import { AccessRequest } from '../../domain/entities/AccessRequest';
import { AccessRequestRepository } from '../../domain/repositories/AccessRequestRepository';
import { AccessRequestEntity } from '../database/entities/AccessRequest';

export class TypeOrmAccessRequestRepository implements AccessRequestRepository {
    constructor(private readonly repo: Repository<AccessRequestEntity>) {}

    async save(request: AccessRequest): Promise<void> {
        await this.repo.save(
            this.repo.create({
                id: request.getId(),
                email: request.getEmail(),
                fullName: request.getFullName(),
                reason: request.getReason(),
                status: request.getStatus(),
                decidedAt: request.getDecidedAt(),
                decidedByUserId: request.getDecidedByUserId(),
            }),
        );
    }

    async findById(id: string): Promise<AccessRequest | null> {
        const row = await this.repo.findOneBy({ id });
        return row ? this.toDomain(row) : null;
    }

    async findPendingByEmail(email: string): Promise<AccessRequest | null> {
        const row = await this.repo.findOneBy({ email: email.trim().toLowerCase(), status: 'pending' });
        return row ? this.toDomain(row) : null;
    }

    async listPending(): Promise<AccessRequest[]> {
        const rows = await this.repo.find({
            where: { status: 'pending' },
            order: { requestedAt: 'ASC' },
        });
        return rows.map((row) => this.toDomain(row));
    }

    private toDomain(row: AccessRequestEntity): AccessRequest {
        return new AccessRequest({
            id: row.id,
            email: row.email,
            fullName: row.fullName,
            reason: row.reason,
            status: row.status,
            requestedAt: row.requestedAt,
            decidedAt: row.decidedAt,
            decidedByUserId: row.decidedByUserId,
        });
    }
}
