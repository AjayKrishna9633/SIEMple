import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { TokenSigner } from '../ports/TokenSigner';

export interface VerifyOneTimeCodeInput {
    challengeId: string;
    code: string;
    ipAddress?: string | null;
}

export interface VerifyOneTimeCodeResult {
    token: string;
    user: User;
}

const INVALID_CODE_MESSAGE = 'Invalid or expired code';

export class VerifyOneTimeCode {
    constructor(
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly userRepository: UserRepository,
        private readonly tokenSigner: TokenSigner,
        private readonly clock: Clock,
    ) {}

    async execute(input: VerifyOneTimeCodeInput): Promise<VerifyOneTimeCodeResult> {
        const userId = await this.otpChallengeStore.verify(input.challengeId, 'login', input.code);
        if (!userId) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        const user = await this.userRepository.findById(userId);
        if (!user || !user.canAuthenticate()) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        user.recordLogin(this.clock.now(), input.ipAddress ?? null);
        await this.userRepository.save(user);

        const token = this.tokenSigner.sign({ userId: user.getId(), role: user.getRole() });
        return { token, user };
    }
}
