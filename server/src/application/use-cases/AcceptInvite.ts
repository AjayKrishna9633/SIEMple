import { User } from '../../domain/entities/User';
import { assertValidPassword } from '../../domain/policies/passwordPolicy';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { InviteTokenService } from '../ports/InviteTokenService';
import { PasswordHasher } from '../ports/PasswordHasher';

export interface AcceptInviteInput {
    token: string;
    email: string;
    username: string;
    password: string;
}


const INVALID_INVITE_MESSAGE = 'This invitation is invalid or has expired';

export class AcceptInvite {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly inviteTokenService: InviteTokenService,
        private readonly clock: Clock,
    ) {}

    async execute(input: AcceptInviteInput): Promise<User> {
        const user = await this.findPendingInvite(input.token);

        
        if (user.getEmail() !== input.email.trim().toLowerCase()) {
            throw new Error(INVALID_INVITE_MESSAGE);
        }

        assertValidPassword(input.password);

        const passwordHash = await this.passwordHasher.hash(input.password);
        user.acceptInvite(passwordHash);
        user.rename(input.username.trim());

        await this.userRepository.save(user);
        return user;
    }

    async findPendingInvite(token: string): Promise<User> {
        const tokenHash = this.inviteTokenService.hash(token);
        const user = await this.userRepository.findByInviteTokenHash(tokenHash);
        if (!user || user.getStatus() !== 'invited' || user.isInviteExpired(this.clock.now())) {
            throw new Error(INVALID_INVITE_MESSAGE);
        }
        return user;
    }
}
