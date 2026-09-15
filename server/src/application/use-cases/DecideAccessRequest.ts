import { AccessRequest } from '../../domain/entities/AccessRequest';
import { UserRole } from '../../domain/entities/User';
import { AccessRequestRepository } from '../../domain/repositories/AccessRequestRepository';
import { Clock } from '../ports/Clock';
import { InviteUser } from './InviteUser';

export interface DecideAccessRequestInput {
    requestId: string;
    adminUserId: string;
    approve: boolean;
    role?: UserRole;
}

export class DecideAccessRequest {
    constructor(
        private readonly accessRequests: AccessRequestRepository,
        private readonly inviteUser: InviteUser,
        private readonly clock: Clock,
    ) {}

    async execute(input: DecideAccessRequestInput): Promise<AccessRequest> {
        const request = await this.accessRequests.findById(input.requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        if (!input.approve) {
            request.deny(input.adminUserId, this.clock.now());
            await this.accessRequests.save(request);
            return request;
        }

        if (!input.role) {
            throw new Error('A role is required to approve a request');
        }

        // Invite first: if the email can't be delivered, InviteUser throws and
        // the request stays pending rather than being marked approved with no
        // account behind it.
        await this.inviteUser.execute({ email: request.getEmail(), role: input.role });

        request.approve(input.adminUserId, this.clock.now());
        await this.accessRequests.save(request);
        return request;
    }
}
