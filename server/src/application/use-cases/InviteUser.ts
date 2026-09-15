import { User, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { IdGenerator } from '../ports/IdGenerator';
import { InviteDeliveryService } from '../ports/InviteDeliveryService';
import { InviteTokenService } from '../ports/InviteTokenService';

export interface InviteUserInput {
    email: string;
    role: UserRole;
}

export class InviteUser {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly inviteTokenService: InviteTokenService,
        private readonly inviteDeliveryService: InviteDeliveryService,
        private readonly clock: Clock,
        private readonly appBaseUrl: string,
        private readonly inviteTtlMs: number,
    ) {}

    async execute(input: InviteUserInput): Promise<User> {
        const email = input.email.trim().toLowerCase();

        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new Error('A user with that email already exists');
        }

        // Invitees have no display name until they accept, so the email stands
        // in for it — the username column is NOT NULL.
        const invitee = new User({
            id: this.idGenerator.generate(),
            email,
            username: email,
            role: input.role,
            status: 'invited',
        });

        const token = this.inviteTokenService.generate();
        const expiresAt = new Date(this.clock.now().getTime() + this.inviteTtlMs);
        invitee.issueInvite(this.inviteTokenService.hash(token), expiresAt);

        // Deliver before persisting so a rejected send leaves no dangling invite.
        const inviteUrl = `${this.appBaseUrl}/accept-invite?token=${token}`;
        await this.inviteDeliveryService.deliver(email, inviteUrl);

        await this.userRepository.save(invitee);
        return invitee;
    }
}
