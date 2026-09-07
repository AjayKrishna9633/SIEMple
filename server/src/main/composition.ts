import type { DataSource } from 'typeorm';
import { TypeOrmUserRepository } from '../infrastructure/repositories/TypeOrmUserRepository';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenSigner } from '../infrastructure/services/JwtTokenSigner';
import { InMemoryOtpChallengeStore } from '../infrastructure/services/InMemoryOtpChallengeStore';
import { ConsoleOtpDeliveryService } from '../infrastructure/services/ConsoleOtpDeliveryService';
import { UserEntity } from '../infrastructure/database/entities/User';
import { GetSetupStatus } from '../application/use-cases/GetSetupStatus';
import { CreateInitialAdmin } from '../application/use-cases/CreateInitialAdmin';
import { AuthenticateUser } from '../application/use-cases/AuthenticateUser';
import { VerifyOneTimeCode } from '../application/use-cases/VerifyOneTimeCode';
import { SetupController } from '../interfaces/http/controllers/SetupController';
import { AuthController } from '../interfaces/http/controllers/AuthController';
import { env } from '../infrastructure/config/env';

export function buildContainer(dataSource: DataSource) {
    const passwordHasher = new BcryptPasswordHasher();
    const userRepository = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));
    const tokenSigner = new JwtTokenSigner(env.jwtSecret, env.jwtExpiresIn);
    const otpChallengeStore = new InMemoryOtpChallengeStore();
    const otpDeliveryService = new ConsoleOtpDeliveryService();

    const getSetupStatus = new GetSetupStatus(userRepository);
    const createInitialAdmin = new CreateInitialAdmin(userRepository, passwordHasher);
    const setupController = new SetupController(getSetupStatus, createInitialAdmin);

    const authenticateUser = new AuthenticateUser(
        userRepository,
        passwordHasher,
        otpChallengeStore,
        otpDeliveryService,
        env.otpTtlMs,
    );
    const verifyOneTimeCode = new VerifyOneTimeCode(otpChallengeStore, userRepository, tokenSigner);
    const authController = new AuthController(authenticateUser, verifyOneTimeCode, {
        name: 'session',
        maxAgeMs: env.sessionCookieMaxAgeMs,
        secure: env.nodeEnv === 'production',
    });

    return { setupController, authController };
}
