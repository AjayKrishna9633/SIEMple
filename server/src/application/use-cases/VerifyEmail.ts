import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';

export interface VerifyEmailInput {
    challengeId: string;
    code: string;
}

const INVALID_CODE_MESSAGE = 'Invalid or expired code';

export class VerifyEmail {
    constructor(
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(input: VerifyEmailInput): Promise<User> {
        const userId = await this.otpChallengeStore.verify(
            input.challengeId,
            'email-verification',
            input.code,
        );
        if (!userId) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        user.markEmailVerified();
        await this.userRepository.save(user);
        return user;
    }
}
