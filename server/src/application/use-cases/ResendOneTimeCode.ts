import { UserRepository } from '../../domain/repositories/UserRepository';
import { generateOtpCode } from '../../shared/utils/generateOtpCode';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { OtpDeliveryService } from '../ports/OtpDeliveryService';

export interface ResendOneTimeCodeInput {
    challengeId: string;
}

export interface ResendOneTimeCodeResult {
    retryAfterMs: number;
}

const UNKNOWN_CHALLENGE_MESSAGE = 'This request has expired. Please start again.';

export class ResendOneTimeCode {
    constructor(
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly userRepository: UserRepository,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly otpTtlMs: number,
        private readonly cooldownMs: number,
    ) {}

    async execute(input: ResendOneTimeCodeInput): Promise<ResendOneTimeCodeResult> {
        const challenge = await this.otpChallengeStore.peek(input.challengeId);
        if (!challenge) {
            throw new Error(UNKNOWN_CHALLENGE_MESSAGE);
        }

        const elapsedMs = Date.now() - challenge.lastSentAt.getTime();
        if (elapsedMs < this.cooldownMs) {
            const waitSeconds = Math.ceil((this.cooldownMs - elapsedMs) / 1000);
            throw new Error(`Please wait ${waitSeconds}s before requesting another code`);
        }

        const user = await this.userRepository.findById(challenge.userId);
        if (!user || !user.getIsActive()) {
            throw new Error(UNKNOWN_CHALLENGE_MESSAGE);
        }

        const code = generateOtpCode();
        await this.otpChallengeStore.replaceCode(input.challengeId, code, this.otpTtlMs);
        await this.otpDeliveryService.deliver(user.getEmail(), code);

        return { retryAfterMs: this.cooldownMs };
    }
}
