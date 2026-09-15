import { AccessRequest } from '../../domain/entities/AccessRequest';
import { AccessRequestRepository } from '../../domain/repositories/AccessRequestRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { IdGenerator } from '../ports/IdGenerator';

export interface RequestAccessInput {
    email: string;
    fullName: string;
    reason: string;
}

export class RequestAccess {
    constructor(
        private readonly accessRequests: AccessRequestRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly clock: Clock,
        /** Empty means any domain is accepted. */
        private readonly allowedDomains: string[],
    ) {}

    async execute(input: RequestAccessInput): Promise<void> {
        const email = input.email.trim().toLowerCase();
        const fullName = input.fullName?.trim();
        const reason = input.reason?.trim();

        if (!fullName || !reason) {
            throw new Error('Please provide your name and a reason for the request');
        }
        if (!this.isDomainAllowed(email)) {
            throw new Error('Access requests are not accepted from that email domain');
        }

        // Already has an account: resolve silently rather than confirming the
        // address is registered.
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            return;
        }

        const pending = await this.accessRequests.findPendingByEmail(email);
        if (pending) {
            pending.restate(fullName, reason);
            await this.accessRequests.save(pending);
            return;
        }

        await this.accessRequests.save(
            new AccessRequest({
                id: this.idGenerator.generate(),
                email,
                fullName,
                reason,
                requestedAt: this.clock.now(),
            }),
        );
    }

    private isDomainAllowed(email: string): boolean {
        if (this.allowedDomains.length === 0) return true;
        const domain = email.split('@')[1];
        return domain !== undefined && this.allowedDomains.includes(domain);
    }
}
