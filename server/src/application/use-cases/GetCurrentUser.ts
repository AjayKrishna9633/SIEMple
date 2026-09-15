import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class GetCurrentUser {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        // A token can outlive the account it was minted for.
        if (!user || !user.canAuthenticate()) {
            throw new Error('Not authenticated');
        }
        return user;
    }
}
