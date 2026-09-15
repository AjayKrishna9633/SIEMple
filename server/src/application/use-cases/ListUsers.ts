import { UserRole, UserStatus } from '../../domain/entities/User';
import {
    SortDirection,
    UserListPage,
    UserRepository,
    UserSortField,
} from '../../domain/repositories/UserRepository';

export interface ListUsersInput {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    sortBy?: UserSortField;
    sortDirection?: SortDirection;
    page?: number;
    pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const SORTABLE_FIELDS: UserSortField[] = [
    'username',
    'role',
    'status',
    'lastLoginAt',
    'createdAt',
];

export class ListUsers {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(
        input: ListUsersInput,
    ): Promise<
        UserListPage & {
            page: number;
            pageSize: number;
            sortBy: UserSortField;
            sortDirection: SortDirection;
        }
    > {
        const page = Math.max(1, input.page ?? 1);
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));

        // Unknown sort keys fall back rather than erroring — a stale bookmark
        // should still render a list.
        const sortBy =
            input.sortBy && SORTABLE_FIELDS.includes(input.sortBy) ? input.sortBy : 'createdAt';
        const sortDirection: SortDirection = input.sortDirection === 'asc' ? 'asc' : 'desc';

        const result = await this.userRepository.list({
            search: input.search,
            role: input.role,
            status: input.status,
            sortBy,
            sortDirection,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });

        return { ...result, page, pageSize, sortBy, sortDirection };
    }
}
