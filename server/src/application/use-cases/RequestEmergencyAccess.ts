import { EmergencyAccessRequest } from '../../domain/entities/EmergencyAccessRequest';
import { EmergencyAccessRequestRepository } from '../../domain/repositories/EmergencyAccessRequestRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { IdGenerator } from '../ports/IdGenerator';

export interface RequestEmergencyAccessInput {
    email: string;
    reason: string;
}

export class RequestEmergencyAccess {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emergencyRequests: EmergencyAccessRequestRepository,
        private readonly idGenerator: IdGenerator,
        private readonly clock: Clock,
    ) {}

    /**
     * Resolves silently whether or not the address exists. The endpoint is
     * public, so reporting "no such user" would turn it into a way to test
     * which addresses have accounts.
     */
    async execute(input: RequestEmergencyAccessInput): Promise<void> {
        const reason = input.reason?.trim();
        if (!reason) {
            throw new Error('Please describe why you need emergency access');
        }

        const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
        if (!user) {
            return;
        }

        // One open request per user — a second submission updates the reason
        // rather than filling the admin's queue with duplicates.
        const existing = await this.emergencyRequests.findPendingByUserId(user.getId());
        if (existing) {
            existing.restate(reason);
            await this.emergencyRequests.save(existing);
            return;
        }

        await this.emergencyRequests.save(
            new EmergencyAccessRequest({
                id: this.idGenerator.generate(),
                userId: user.getId(),
                reason,
                requestedAt: this.clock.now(),
            }),
        );
    }
}
