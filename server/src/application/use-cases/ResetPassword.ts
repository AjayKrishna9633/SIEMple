import { User } from '../../domain/entities/User';
import { assertValidPassword } from '../../domain/policies/passwordPolicy';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { InviteTokenService } from '../ports/InviteTokenService';
import { PasswordChangeNotifier } from '../ports/PasswordChangeNotifier';
import { PasswordHasher } from '../ports/PasswordHasher';

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
}

const INVALID_TOKEN_MESSAGE = 'This password reset link is invalid or has expired';

export class ResetPassword {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly tokenService: InviteTokenService,
        private readonly notifier: PasswordChangeNotifier,
        private readonly clock: Clock,
    ) {}

    async execute(input: ResetPasswordInput): Promise<void> {
        const user = await this.findValidReset(input.token);

        assertValidPassword(input.newPassword);

        user.resetPassword(await this.passwordHasher.hash(input.newPassword));
        await this.userRepository.save(user);

        // Persisted already, so a mail failure must not report the reset failed.
        try {
            await this.notifier.notify(user.getEmail());
        } catch (err) {
            console.error('Password reset but the notification email failed:', err);
        }
    }

    /** Also used to check a link before showing the form. */
    async findValidReset(token: string): Promise<User> {
        const tokenHash = this.tokenService.hash(token);
        const user = await this.userRepository.findByPasswordResetTokenHash(tokenHash);
        if (!user || !user.canAuthenticate() || user.isPasswordResetExpired(this.clock.now())) {
            throw new Error(INVALID_TOKEN_MESSAGE);
        }
        return user;
    }
}
