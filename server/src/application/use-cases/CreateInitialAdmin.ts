import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { generateOtpCode } from '../../shared/utils/generateOtpCode';
import { PasswordHasher } from '../ports/PasswordHasher';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { OtpDeliveryService } from '../ports/OtpDeliveryService';

export interface CreateInitialAdminInput {
    email: string;
    username: string;
    password: string;
}

export interface CreateInitialAdminResult {
    user: User;
    challengeId: string;
}

export class CreateInitialAdmin {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly otpTtlMs: number,
    ) {}

    async execute(input: CreateInitialAdminInput): Promise<CreateInitialAdminResult> {
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

        // Deliver before persisting: if the provider rejects the send, nothing
        // is written and setup stays retryable. Creating the admin first would
        // consume the one-shot setup slot with an unreachable email address.
        const code = generateOtpCode();
        const challengeId = await this.otpChallengeStore.create(
            admin.getId(),
            'email-verification',
            code,
            this.otpTtlMs,
        );
        await this.otpDeliveryService.deliver(admin.getEmail(), code);

        await this.userRepository.save(admin);
        return { user: admin, challengeId };
    }
}
