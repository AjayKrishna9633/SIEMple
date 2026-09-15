import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { InviteDeliveryService } from '../ports/InviteDeliveryService';
import { InviteTokenService } from '../ports/InviteTokenService';

export interface ResendInviteInput {
    userId: string;
}

/**
 * Reissues an invitation. Without this an invitee whose link expired is stuck
 * forever: they have no password to sign in with, InviteUser rejects the
 * address as taken, and accounts are never deleted.
 */
export class ResendInvite {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly inviteTokenService: InviteTokenService,
        private readonly inviteDeliveryService: InviteDeliveryService,
        private readonly clock: Clock,
        private readonly appBaseUrl: string,
        private readonly inviteTtlMs: number,
    ) {}

    async execute(input: ResendInviteInput): Promise<User> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (user.getStatus() !== 'invited') {
            throw new Error('Only a pending invitation can be resent');
        }

        const token = this.inviteTokenService.generate();
        const expiresAt = new Date(this.clock.now().getTime() + this.inviteTtlMs);
        user.issueInvite(this.inviteTokenService.hash(token), expiresAt);

        // Deliver before persisting: if the send fails the previous link keeps
        // working rather than being silently replaced by one nobody received.
        const inviteUrl = `${this.appBaseUrl}/accept-invite?token=${token}`;
        await this.inviteDeliveryService.deliver(user.getEmail(), inviteUrl);

        await this.userRepository.save(user);
        return user;
    }
}
