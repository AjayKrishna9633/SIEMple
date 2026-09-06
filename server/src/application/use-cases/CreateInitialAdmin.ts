import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';

export interface CreateInitialAdminInput {
    email: string;
    username: string;
    password: string;
}

export class CreateInitialAdmin {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
    ) {}

    async execute(input: CreateInitialAdminInput): Promise<User> {
        const existingUserCount = await this.userRepository.count();
        if (existingUserCount > 0) {
            throw new Error('Setup has already been completed');
        }

        const passwordHash = await this.passwordHasher.hash(input.password);

        const admin = new User({
            id: randomUUID(),
            email: input.email,
            username: input.username,
            passwordHash,
            role: 'admin',
        });

        await this.userRepository.save(admin);
        return admin;
    }
}
