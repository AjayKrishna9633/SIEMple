import { assertValidPassword } from '../../domain/policies/passwordPolicy';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { PasswordChangeNotifier } from '../ports/PasswordChangeNotifier';
import { PasswordHasher } from '../ports/PasswordHasher';

export interface ChangeOwnPasswordInput {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export class ChangeOwnPassword {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly notifier: PasswordChangeNotifier,
    ) {}

    async execute(input: ChangeOwnPasswordInput): Promise<void> {
        const user = await this.userRepository.findById(input.userId);
        const currentHash = user?.getPasswordHash();
        if (!user || !currentHash) {
            throw new Error('User not found');
        }

        // Proving the current password is what stops a hijacked session from
        // locking the real owner out of their own account.
        const matches = await this.passwordHasher.compare(input.currentPassword, currentHash);
        if (!matches) {
            throw new Error('Your current password is incorrect');
        }

        assertValidPassword(input.newPassword);

        if (await this.passwordHasher.compare(input.newPassword, currentHash)) {
            throw new Error('Your new password must be different from your current one');
        }

        user.changePassword(await this.passwordHasher.hash(input.newPassword));
        await this.userRepository.save(user);

        // Persist first, then notify: the change has already taken effect, so a
        // mail outage must not report failure for something that succeeded.
        try {
            await this.notifier.notify(user.getEmail());
        } catch (err) {
            console.error('Password changed but the notification email failed:', err);
        }
    }
}
