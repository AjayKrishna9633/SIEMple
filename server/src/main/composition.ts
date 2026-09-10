import type { DataSource } from 'typeorm';
import { TypeOrmUserRepository } from '../infrastructure/repositories/TypeOrmUserRepository';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenSigner } from '../infrastructure/services/JwtTokenSigner';
import { InMemoryOtpChallengeStore } from '../infrastructure/services/InMemoryOtpChallengeStore';
import { ConsoleOtpDeliveryService } from '../infrastructure/services/ConsoleOtpDeliveryService';
import { ResendOtpDeliveryService } from '../infrastructure/services/ResendOtpDeliveryService';
import { UserEntity } from '../infrastructure/database/entities/User';
import { GetSetupStatus } from '../application/use-cases/GetSetupStatus';
import { CreateInitialAdmin } from '../application/use-cases/CreateInitialAdmin';
import { AuthenticateUser } from '../application/use-cases/AuthenticateUser';
import { VerifyOneTimeCode } from '../application/use-cases/VerifyOneTimeCode';
import { VerifyEmail } from '../application/use-cases/VerifyEmail';
import { ResendOneTimeCode } from '../application/use-cases/ResendOneTimeCode';
import { SetupController } from '../interfaces/http/controllers/SetupController';
import { AuthController } from '../interfaces/http/controllers/AuthController';
import { env } from '../infrastructure/config/env';

export function buildContainer(dataSource: DataSource) {
    const passwordHasher = new BcryptPasswordHasher();
    const userRepository = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));
    const tokenSigner = new JwtTokenSigner(env.jwtSecret, env.jwtExpiresIn);
    const otpChallengeStore = new InMemoryOtpChallengeStore();
    const otpDeliveryService = env.resendApiKey
        ? new ResendOtpDeliveryService(env.resendApiKey, env.otpFromEmail)
        : new ConsoleOtpDeliveryService();

    const getSetupStatus = new GetSetupStatus(userRepository);
    const createInitialAdmin = new CreateInitialAdmin(
        userRepository,
        passwordHasher,
        otpChallengeStore,
        otpDeliveryService,
        env.otpTtlMs,
    );
    const setupController = new SetupController(getSetupStatus, createInitialAdmin);

    const authenticateUser = new AuthenticateUser(
        userRepository,
        passwordHasher,
        otpChallengeStore,
        otpDeliveryService,
        env.otpTtlMs,
    );
    const verifyOneTimeCode = new VerifyOneTimeCode(otpChallengeStore, userRepository, tokenSigner);
    const verifyEmail = new VerifyEmail(otpChallengeStore, userRepository);
    const resendOneTimeCode = new ResendOneTimeCode(
        otpChallengeStore,
        userRepository,
        otpDeliveryService,
        env.otpTtlMs,
        env.otpResendCooldownMs,
    );
    const authController = new AuthController(
        authenticateUser,
        verifyOneTimeCode,
        verifyEmail,
        resendOneTimeCode,
        {
            name: 'session',
            maxAgeMs: env.sessionCookieMaxAgeMs,
            secure: env.nodeEnv === 'production',
        },
    );

    return { setupController, authController };
}
