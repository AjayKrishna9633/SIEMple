import { User } from '../../domain/entities/User';
import { EmergencyAccessRequestRepository } from '../../domain/repositories/EmergencyAccessRequestRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Clock } from '../ports/Clock';
import { PasswordHasher } from '../ports/PasswordHasher';
import { OtpChallengeStore } from '../ports/OtpChallengeStore';
import { OtpCodeGenerator } from '../ports/OtpCodeGenerator';
import { OtpDeliveryService } from '../ports/OtpDeliveryService';
import { TokenSigner } from '../ports/TokenSigner';

export interface AuthenticateUserInput {
    email: string;
    password: string;
    ipAddress?: string | null;
}

/** Login ends either with a code to verify, or — via emergency access — a session. */
export type AuthenticateUserResult =
    | { kind: 'otp-required'; challengeId: string }
    | { kind: 'signed-in'; token: string; user: User };

const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';
const ACCOUNT_DISABLED_MESSAGE =
    'Your account has been disabled. Contact your administrator.';

export class AuthenticateUser {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emergencyRequests: EmergencyAccessRequestRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly otpChallengeStore: OtpChallengeStore,
        private readonly otpCodeGenerator: OtpCodeGenerator,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly tokenSigner: TokenSigner,
        private readonly clock: Clock,
        private readonly otpTtlMs: number,
    ) {}

    async execute(input: AuthenticateUserInput): Promise<AuthenticateUserResult> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        // Pending invitees have no password to prove ownership with, so they
        // stay on the generic message.
        const passwordHash = user.getPasswordHash();
        if (!passwordHash) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        const passwordMatches = await this.passwordHasher.compare(input.password, passwordHash);
        if (!passwordMatches) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        // Only now, having proved the credentials, is it safe to say why a
        // login failed — checking status earlier would let anyone enumerate
        // which accounts are blocked.
        if (!user.canAuthenticate()) {
            throw new Error(ACCOUNT_DISABLED_MESSAGE);
        }

        // Emergency access waives the second factor, never the password — so it
        // is deliberately consulted only after the checks above have passed.
        const grant = await this.emergencyRequests.findUsableGrant(user.getId(), this.clock.now());
        if (grant) {
            grant.consume();
            await this.emergencyRequests.save(grant);

            user.recordLogin(this.clock.now(), input.ipAddress ?? null);
            await this.userRepository.save(user);

            const token = this.tokenSigner.sign({ userId: user.getId(), role: user.getRole() });
            return { kind: 'signed-in', token, user };
        }

        const code = this.otpCodeGenerator.generate();
        const challengeId = await this.otpChallengeStore.create(user.getId(), 'login', code, this.otpTtlMs);
        await this.otpDeliveryService.deliver(user.getEmail(), code);

        return { kind: 'otp-required', challengeId };
    }
}
