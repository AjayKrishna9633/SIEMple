import { User, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface UpdateUserInput {
    actingUserId: string;
    targetUserId: string;
    username?: string;
    role?: UserRole;
}

export class UpdateUser {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: UpdateUserInput): Promise<User> {
        const user = await this.userRepository.findById(input.targetUserId);
        if (!user) {
            throw new Error('User not found');
        }

        // Demoting yourself would revoke your own access to this screen.
        if (input.role && input.role !== 'admin' && input.targetUserId === input.actingUserId) {
            throw new Error('You cannot change your own role');
        }

        if (input.username !== undefined) {
            user.rename(input.username.trim());
        }
        if (input.role !== undefined) {
            user.changeRole(input.role);
        }

        await this.userRepository.save(user);
        return user;
    }
}
