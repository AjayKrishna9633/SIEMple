import { EmergencyAccessRequest } from '../../domain/entities/EmergencyAccessRequest';
import { EmergencyAccessRequestRepository } from '../../domain/repositories/EmergencyAccessRequestRepository';
import { Clock } from '../ports/Clock';

export interface DecideEmergencyAccessRequestInput {
    requestId: string;
    adminUserId: string;
    approve: boolean;
}

export class DecideEmergencyAccessRequest {
    constructor(
        private readonly emergencyRequests: EmergencyAccessRequestRepository,
        private readonly clock: Clock,
        private readonly grantTtlMs: number,
    ) {}

    async execute(input: DecideEmergencyAccessRequestInput): Promise<EmergencyAccessRequest> {
        const request = await this.emergencyRequests.findById(input.requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        if (input.approve) {
            request.approve(input.adminUserId, this.clock.now(), this.grantTtlMs);
        } else {
            request.deny(input.adminUserId, this.clock.now());
        }

        await this.emergencyRequests.save(request);
        return request;
    }
}
