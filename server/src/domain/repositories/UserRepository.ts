import { User, UserRole, UserStatus } from '../entities/User';

export type UserSortField = 'username' | 'role' | 'status' | 'lastLoginAt' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface UserListFilter {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    sortBy: UserSortField;
    sortDirection: SortDirection;
    limit: number;
    offset: number;
}

export interface UserListPage {
    users: User[];
    total: number;
}

export interface UserStatusCounts {
    total: number;
    invited: number;
    disabled: number;
}

export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByInviteTokenHash(tokenHash: string): Promise<User | null>;
    findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
    save(user: User): Promise<void>;
    count(): Promise<number>;
    list(filter: UserListFilter): Promise<UserListPage>;
    statusCounts(): Promise<UserStatusCounts>;
}
