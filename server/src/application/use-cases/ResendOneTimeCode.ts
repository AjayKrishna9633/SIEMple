import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { OtpCodeGenerator } from '../ports/OtpCodeGenerator';
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
        private readonly otpCodeGenerator: OtpCodeGenerator,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly clock: Clock,
        private readonly otpTtlMs: number,
        private readonly cooldownMs: number,
    ) {}

    async execute(input: ResendOneTimeCodeInput): Promise<ResendOneTimeCodeResult> {
        const challenge = await this.otpChallengeStore.peek(input.challengeId);
        if (!challenge) {
            throw new Error(UNKNOWN_CHALLENGE_MESSAGE);
        }

        const elapsedMs = this.clock.now().getTime() - challenge.lastSentAt.getTime();
        if (elapsedMs < this.cooldownMs) {
            const waitSeconds = Math.ceil((this.cooldownMs - elapsedMs) / 1000);
            throw new Error(`Please wait ${waitSeconds}s before requesting another code`);
        }

        const user = await this.userRepository.findById(challenge.userId);
        if (!user || !user.canAuthenticate()) {
            throw new Error(UNKNOWN_CHALLENGE_MESSAGE);
        }

        const code = this.otpCodeGenerator.generate();
        await this.otpChallengeStore.replaceCode(input.challengeId, code, this.otpTtlMs);
        await this.otpDeliveryService.deliver(user.getEmail(), code);

        return { retryAfterMs: this.cooldownMs };
    }
}
