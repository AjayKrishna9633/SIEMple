import { randomInt } from 'node:crypto';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { OtpDeliveryService } from '../ports/OtpDeliveryService';

export interface AuthenticateUserInput {
    email: string;
    password: string;
}

export interface AuthenticateUserResult {
    challengeId: string;
}

const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

export class AuthenticateUser {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly otpTtlMs: number,
    ) {}

    async execute(input: AuthenticateUserInput): Promise<AuthenticateUserResult> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user || !user.getIsActive()) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        const passwordMatches = await this.passwordHasher.compare(input.password, user.getPasswordHash());
        if (!passwordMatches) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
        const challengeId = await this.otpChallengeStore.create(user.getId(), code, this.otpTtlMs);
        await this.otpDeliveryService.deliver(user.getEmail(), code);

        return { challengeId };
    }
}
