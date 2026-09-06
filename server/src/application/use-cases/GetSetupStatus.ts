import { UserRepository } from '../../domain/repositories/UserRepository';

export interface SetupStatus {
    isSetupComplete: boolean;
}

export class GetSetupStatus {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(): Promise<SetupStatus> {
        const userCount = await this.userRepository.count();
        return { isSetupComplete: userCount > 0 };
    }
}
