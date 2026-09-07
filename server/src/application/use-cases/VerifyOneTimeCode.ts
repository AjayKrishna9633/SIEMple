import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { TokenSigner } from '../ports/TokenSigner';

export interface VerifyOneTimeCodeInput {
    challengeId: string;
    code: string;
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
    ) {}

    async execute(input: VerifyOneTimeCodeInput): Promise<VerifyOneTimeCodeResult> {
        const userId = await this.otpChallengeStore.verify(input.challengeId, input.code);
        if (!userId) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        const user = await this.userRepository.findById(userId);
        if (!user || !user.getIsActive()) {
            throw new Error(INVALID_CODE_MESSAGE);
        }

        const token = this.tokenSigner.sign({ userId: user.getId(), role: user.getRole() });
        return { token, user };
    }
}
