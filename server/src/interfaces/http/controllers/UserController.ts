import type { Request, Response } from 'express';
import type { UserRole, UserStatus } from '../../../domain/entities/User';
import type { UserSortField } from '../../../domain/repositories/UserRepository';
import { toUserResponse } from '../presenters/userResponse';
import { ListUsers } from '../../../application/use-cases/ListUsers';
import { GetUserStats } from '../../../application/use-cases/GetUserStats';
import { InviteUser } from '../../../application/use-cases/InviteUser';
import { UpdateUser } from '../../../application/use-cases/UpdateUser';
import { SetUserStatus } from '../../../application/use-cases/SetUserStatus';
import { ListEmergencyAccessRequests } from '../../../application/use-cases/ListEmergencyAccessRequests';
import { DecideEmergencyAccessRequest } from '../../../application/use-cases/DecideEmergencyAccessRequest';
import { ListAccessRequests } from '../../../application/use-cases/ListAccessRequests';
import { DecideAccessRequest } from '../../../application/use-cases/DecideAccessRequest';
import { ResendInvite } from '../../../application/use-cases/ResendInvite';

const ROLES: UserRole[] = ['admin', 'tier1_analyst', 'tier2_analyst'];
const STATUSES: UserStatus[] = ['active', 'invited', 'disabled'];

function asRole(value: unknown): UserRole | undefined {
    return ROLES.includes(value as UserRole) ? (value as UserRole) : undefined;
}

function asStatus(value: unknown): UserStatus | undefined {
    return STATUSES.includes(value as UserStatus) ? (value as UserStatus) : undefined;
}

export class UserController {
    constructor(
        private readonly listUsers: ListUsers,
        private readonly getUserStats: GetUserStats,
        private readonly inviteUser: InviteUser,
        private readonly updateUser: UpdateUser,
        private readonly setUserStatus: SetUserStatus,
        private readonly listEmergencyAccessRequests: ListEmergencyAccessRequests,
        private readonly decideEmergencyAccessRequest: DecideEmergencyAccessRequest,
        private readonly listAccessRequestsUseCase: ListAccessRequests,
        private readonly decideAccessRequestUseCase: DecideAccessRequest,
        private readonly resendInviteUseCase: ResendInvite,
    ) {}

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.listUsers.execute({
                search: typeof req.query.search === 'string' ? req.query.search : undefined,
                role: asRole(req.query.role),
                status: asStatus(req.query.status),
                sortBy: req.query.sortBy as UserSortField | undefined,
                sortDirection: req.query.sortDirection === 'asc' ? 'asc' : 'desc',
                page: req.query.page ? Number(req.query.page) : undefined,
                pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
            });

            res.status(200).json({
                users: result.users.map(toUserResponse),
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                sortBy: result.sortBy,
                sortDirection: result.sortDirection,
            });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    stats = async (_req: Request, res: Response): Promise<void> => {
        const stats = await this.getUserStats.execute();
        res.status(200).json(stats);
    };

    invite = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, role } = req.body;
            const parsedRole = asRole(role);
            if (!email || !parsedRole) {
                res.status(400).json({ message: 'A valid email and role are required' });
                return;
            }

            const user = await this.inviteUser.execute({ email, role: parsedRole });
            res.status(201).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, role } = req.body;
            const user = await this.updateUser.execute({
                actingUserId: req.auth!.userId,
                targetUserId: String(req.params.id),
                username,
                role: role === undefined ? undefined : asRole(role),
            });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    listAccessRequests = async (_req: Request, res: Response): Promise<void> => {
        const pending = await this.listAccessRequestsUseCase.execute();
        res.status(200).json(
            pending.map((request) => ({
                id: request.getId(),
                email: request.getEmail(),
                fullName: request.getFullName(),
                reason: request.getReason(),
                requestedAt: request.getRequestedAt(),
            })),
        );
    };

    decideAccessRequest = async (req: Request, res: Response): Promise<void> => {
        try {
            const request = await this.decideAccessRequestUseCase.execute({
                requestId: String(req.params.id),
                adminUserId: req.auth!.userId,
                approve: Boolean(req.body.approve),
                role: asRole(req.body.role),
            });
            res.status(200).json({ id: request.getId(), status: request.getStatus() });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    listEmergencyRequests = async (_req: Request, res: Response): Promise<void> => {
        const pending = await this.listEmergencyAccessRequests.execute();
        res.status(200).json(
            pending.map(({ request, userEmail, userName }) => ({
                id: request.getId(),
                userEmail,
                userName,
                reason: request.getReason(),
                requestedAt: request.getRequestedAt(),
            })),
        );
    };

    decideEmergencyRequest = async (req: Request, res: Response): Promise<void> => {
        try {
            const request = await this.decideEmergencyAccessRequest.execute({
                requestId: String(req.params.id),
                adminUserId: req.auth!.userId,
                approve: Boolean(req.body.approve),
            });
            res.status(200).json({
                id: request.getId(),
                status: request.getStatus(),
                grantExpiresAt: request.getGrantExpiresAt(),
            });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    resendInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.resendInviteUseCase.execute({ userId: String(req.params.id) });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    setStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.setUserStatus.execute({
                actingUserId: req.auth!.userId,
                targetUserId: String(req.params.id),
                enabled: Boolean(req.body.enabled),
            });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };
}
