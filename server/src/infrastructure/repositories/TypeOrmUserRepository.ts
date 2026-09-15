import { Repository } from 'typeorm';
import { User } from '../../domain/entities/User';
import {
    UserListFilter,
    UserListPage,
    UserRepository,
    UserSortField,
    UserStatusCounts,
} from '../../domain/repositories/UserRepository';
import { UserEntity } from '../database/entities/User';

// Allowlist: the sort key arrives from a query string, and interpolating that
// straight into ORDER BY would be an injection hole.
const SORT_COLUMNS: Record<UserSortField, string> = {
    username: 'user.username',
    role: 'user.role',
    status: 'user.status',
    lastLoginAt: 'user.last_login_at',
    createdAt: 'user.created_at',
};

export class TypeOrmUserRepository implements UserRepository {
    constructor(private readonly repo: Repository<UserEntity>) {}

    async findByEmail(email: string): Promise<User | null> {
        const row = await this.repo.findOneBy({ email });
        return row ? this.toDomain(row) : null;
    }

    async findById(id: string): Promise<User | null> {
        const row = await this.repo.findOneBy({ id });
        return row ? this.toDomain(row) : null;
    }

    async findByInviteTokenHash(tokenHash: string): Promise<User | null> {
        const row = await this.repo.findOneBy({ inviteTokenHash: tokenHash });
        return row ? this.toDomain(row) : null;
    }

    async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
        const row = await this.repo.findOneBy({ passwordResetTokenHash: tokenHash });
        return row ? this.toDomain(row) : null;
    }

    async count(): Promise<number> {
        return this.repo.count();
    }

    async list(filter: UserListFilter): Promise<UserListPage> {
        const query = this.repo.createQueryBuilder('user');

        if (filter.search) {
            query.andWhere('(user.username ILIKE :search OR user.email ILIKE :search)', {
                search: `%${filter.search}%`,
            });
        }
        if (filter.role) {
            query.andWhere('user.role = :role', { role: filter.role });
        }
        if (filter.status) {
            query.andWhere('user.status = :status', { status: filter.status });
        }

        // NULLS LAST matters for last_login_at: Postgres puts NULLs first on
        // DESC, which would rank everyone who has never signed in above the
        // most recent logins.
        const [rows, total] = await query
            .orderBy(
                SORT_COLUMNS[filter.sortBy],
                filter.sortDirection === 'asc' ? 'ASC' : 'DESC',
                'NULLS LAST',
            )
            // Enums and names tie constantly, so a stable tiebreak keeps rows
            // from shuffling between pages.
            .addOrderBy('user.created_at', 'DESC')
            .skip(filter.offset)
            .take(filter.limit)
            .getManyAndCount();

        return { users: rows.map((row) => this.toDomain(row)), total };
    }

    async statusCounts(): Promise<UserStatusCounts> {
        const rows = await this.repo
            .createQueryBuilder('user')
            .select('user.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.status')
            .getRawMany<{ status: string; count: string }>();

        const countFor = (status: string) =>
            Number(rows.find((row) => row.status === status)?.count ?? 0);

        return {
            total: rows.reduce((sum, row) => sum + Number(row.count), 0),
            invited: countFor('invited'),
            disabled: countFor('disabled'),
        };
    }

    async save(user: User): Promise<void> {
        const entity = this.repo.create({
            id: user.getId(),
            email: user.getEmail(),
            passwordHash: user.getPasswordHash(),
            username: user.getUsername(),
            role: user.getRole(),
            status: user.getStatus(),
            isEmailVerified: user.getIsEmailVerified(),
            inviteTokenHash: user.getInviteTokenHash(),
            inviteExpiresAt: user.getInviteExpiresAt(),
            passwordResetTokenHash: user.getPasswordResetTokenHash(),
            passwordResetExpiresAt: user.getPasswordResetExpiresAt(),
            lastLoginAt: user.getLastLoginAt(),
            lastSignInIp: user.getLastSignInIp(),
        });
        await this.repo.save(entity);
    }

    private toDomain(row: UserEntity): User {
        return new User({
            id: row.id,
            email: row.email,
            passwordHash: row.passwordHash,
            username: row.username,
            role: row.role,
            status: row.status,
            isEmailVerified: row.isEmailVerified,
            inviteTokenHash: row.inviteTokenHash,
            inviteExpiresAt: row.inviteExpiresAt,
            passwordResetTokenHash: row.passwordResetTokenHash,
            passwordResetExpiresAt: row.passwordResetExpiresAt,
            lastLoginAt: row.lastLoginAt,
            lastSignInIp: row.lastSignInIp,
            createdAt: row.createdAt,
        });
    }
}
