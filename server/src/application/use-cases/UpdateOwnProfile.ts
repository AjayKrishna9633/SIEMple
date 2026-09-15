import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface UpdateOwnProfileInput {
    userId: string;
    username: string;
}

/**
 * Self-service profile edits. Deliberately narrower than UpdateUser: a user can
 * rename themselves but cannot touch their own role, status or email, so this
 * can never be used to escalate privileges.
 */
export class UpdateOwnProfile {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: UpdateOwnProfileInput): Promise<User> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.rename(input.username.trim());
        await this.userRepository.save(user);
        return user;
    }
}
