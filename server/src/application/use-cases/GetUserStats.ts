import { UserRepository, UserStatusCounts } from '../../domain/repositories/UserRepository';

export class GetUserStats {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(): Promise<UserStatusCounts> {
        return this.userRepository.statusCounts();
    }
}
