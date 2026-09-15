import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { InviteTokenService } from '../ports/InviteTokenService';
import { PasswordResetDeliveryService } from '../ports/PasswordResetDeliveryService';

export interface RequestPasswordResetInput {
    email: string;
}

export class RequestPasswordReset {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenService: InviteTokenService,
        private readonly deliveryService: PasswordResetDeliveryService,
        private readonly clock: Clock,
        private readonly appBaseUrl: string,
        private readonly resetTtlMs: number,
    ) {}

    /**
     * Resolves silently for unknown addresses, pending invitees and disabled
     * accounts. Any difference in behaviour would reveal which addresses are
     * registered and what state they are in.
     */
    async execute(input: RequestPasswordResetInput): Promise<void> {
        const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
        if (!user || !user.canAuthenticate()) {
            return;
        }

        const token = this.tokenService.generate();
        const expiresAt = new Date(this.clock.now().getTime() + this.resetTtlMs);
        user.issuePasswordReset(this.tokenService.hash(token), expiresAt);

        // Deliver before persisting: a failed send leaves any previous link
        // intact rather than replacing it with one nobody received.
        await this.deliveryService.deliver(
            user.getEmail(),
            `${this.appBaseUrl}/reset-password?token=${token}`,
        );

        await this.userRepository.save(user);
    }
}
