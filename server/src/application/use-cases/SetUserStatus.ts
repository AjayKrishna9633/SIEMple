import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface SetUserStatusInput {
    actingUserId: string;
    targetUserId: string;
    enabled: boolean;
}

export class SetUserStatus {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: SetUserStatusInput): Promise<User> {
        if (input.targetUserId === input.actingUserId) {
            throw new Error('You cannot disable your own account');
        }

        const user = await this.userRepository.findById(input.targetUserId);
        if (!user) {
            throw new Error('User not found');
        }

        if (input.enabled) {
            user.enable();
        } else {
            user.disable();
        }

        await this.userRepository.save(user);
        return user;
    }
}
