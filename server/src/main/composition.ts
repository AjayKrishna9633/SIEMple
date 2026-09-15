import type { DataSource } from 'typeorm';
import { TypeOrmUserRepository } from '../infrastructure/repositories/TypeOrmUserRepository';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenSigner } from '../infrastructure/services/JwtTokenSigner';
import { SystemClock } from '../infrastructure/services/SystemClock';
import { CryptoIdGenerator } from '../infrastructure/services/CryptoIdGenerator';
import { CryptoOtpCodeGenerator } from '../infrastructure/services/CryptoOtpCodeGenerator';
import { CryptoInviteTokenService } from '../infrastructure/services/CryptoInviteTokenService';
import { InMemoryOtpChallengeStore } from '../infrastructure/services/InMemoryOtpChallengeStore';
import { ConsoleOtpDeliveryService } from '../infrastructure/services/ConsoleOtpDeliveryService';
import { ConsoleInviteDeliveryService } from '../infrastructure/services/ConsoleInviteDeliveryService';
import { EmailPasswordChangeNotifier } from '../infrastructure/services/EmailPasswordChangeNotifier';
import { ConsolePasswordChangeNotifier } from '../infrastructure/services/ConsolePasswordChangeNotifier';
import { ChangeOwnPassword } from '../application/use-cases/ChangeOwnPassword';
import { EmailPasswordResetDeliveryService } from '../infrastructure/services/EmailPasswordResetDeliveryService';
import { ConsolePasswordResetDeliveryService } from '../infrastructure/services/ConsolePasswordResetDeliveryService';
import { RequestPasswordReset } from '../application/use-cases/RequestPasswordReset';
import { ResetPassword } from '../application/use-cases/ResetPassword';
import { BrevoMailer } from '../infrastructure/services/BrevoMailer';
import type { Mailer } from '../infrastructure/services/Mailer';
import { EmailOtpDeliveryService } from '../infrastructure/services/EmailOtpDeliveryService';
import { EmailInviteDeliveryService } from '../infrastructure/services/EmailInviteDeliveryService';
import { UserEntity } from '../infrastructure/database/entities/User';
import { EmergencyAccessRequestEntity } from '../infrastructure/database/entities/EmergencyAccessRequest';
import { TypeOrmEmergencyAccessRequestRepository } from '../infrastructure/repositories/TypeOrmEmergencyAccessRequestRepository';
import { AccessRequestEntity } from '../infrastructure/database/entities/AccessRequest';
import { TypeOrmAccessRequestRepository } from '../infrastructure/repositories/TypeOrmAccessRequestRepository';
import { RequestAccess } from '../application/use-cases/RequestAccess';
import { ListAccessRequests } from '../application/use-cases/ListAccessRequests';
import { DecideAccessRequest } from '../application/use-cases/DecideAccessRequest';
import { ResendInvite } from '../application/use-cases/ResendInvite';
import { RequestEmergencyAccess } from '../application/use-cases/RequestEmergencyAccess';
import { ListEmergencyAccessRequests } from '../application/use-cases/ListEmergencyAccessRequests';
import { DecideEmergencyAccessRequest } from '../application/use-cases/DecideEmergencyAccessRequest';
import { GetSetupStatus } from '../application/use-cases/GetSetupStatus';
import { CreateInitialAdmin } from '../application/use-cases/CreateInitialAdmin';
import { AuthenticateUser } from '../application/use-cases/AuthenticateUser';
import { VerifyOneTimeCode } from '../application/use-cases/VerifyOneTimeCode';
import { VerifyEmail } from '../application/use-cases/VerifyEmail';
import { ResendOneTimeCode } from '../application/use-cases/ResendOneTimeCode';
import { GetCurrentUser } from '../application/use-cases/GetCurrentUser';
import { AcceptInvite } from '../application/use-cases/AcceptInvite';
import { UpdateOwnProfile } from '../application/use-cases/UpdateOwnProfile';
import { InviteUser } from '../application/use-cases/InviteUser';
import { ListUsers } from '../application/use-cases/ListUsers';
import { GetUserStats } from '../application/use-cases/GetUserStats';
import { UpdateUser } from '../application/use-cases/UpdateUser';
import { SetUserStatus } from '../application/use-cases/SetUserStatus';
import { SetupController } from '../interfaces/http/controllers/SetupController';
import { AuthController } from '../interfaces/http/controllers/AuthController';
import { UserController } from '../interfaces/http/controllers/UserController';
import { createRequireAuth } from '../interfaces/http/middlewares/requireAuth';
import { env } from '../infrastructure/config/env';

const SESSION_COOKIE_NAME = 'session';

/** Null means no provider is configured — callers fall back to console delivery. */
function createMailer(): Mailer | null {
    if (env.brevoApiKey) {
        return new BrevoMailer(env.brevoApiKey, env.otpFromEmail);
    }
    return null;
}

export function buildContainer(dataSource: DataSource) {
    const clock = new SystemClock();
    const idGenerator = new CryptoIdGenerator();
    const otpCodeGenerator = new CryptoOtpCodeGenerator();
    const inviteTokenService = new CryptoInviteTokenService();

    const passwordHasher = new BcryptPasswordHasher();
    const userRepository = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));
    const tokenSigner = new JwtTokenSigner(env.jwtSecret, env.jwtExpiresIn);
    const emergencyRequests = new TypeOrmEmergencyAccessRequestRepository(
        dataSource.getRepository(EmergencyAccessRequestEntity),
        dataSource.getRepository(UserEntity),
    );
    const accessRequests = new TypeOrmAccessRequestRepository(
        dataSource.getRepository(AccessRequestEntity),
    );
    const otpChallengeStore = new InMemoryOtpChallengeStore(clock);

    const mailer = createMailer();
    const otpDeliveryService = mailer
        ? new EmailOtpDeliveryService(mailer)
        : new ConsoleOtpDeliveryService();
    const inviteDeliveryService = mailer
        ? new EmailInviteDeliveryService(mailer)
        : new ConsoleInviteDeliveryService();
    const passwordChangeNotifier = mailer
        ? new EmailPasswordChangeNotifier(mailer)
        : new ConsolePasswordChangeNotifier();
    const passwordResetDelivery = mailer
        ? new EmailPasswordResetDeliveryService(mailer)
        : new ConsolePasswordResetDeliveryService();

    const getSetupStatus = new GetSetupStatus(userRepository);
    const createInitialAdmin = new CreateInitialAdmin(
        userRepository,
        passwordHasher,
        idGenerator,
        otpChallengeStore,
        otpCodeGenerator,
        otpDeliveryService,
        env.otpTtlMs,
    );
    const setupController = new SetupController(getSetupStatus, createInitialAdmin);

    const authenticateUser = new AuthenticateUser(
        userRepository,
        emergencyRequests,
        passwordHasher,
        otpChallengeStore,
        otpCodeGenerator,
        otpDeliveryService,
        tokenSigner,
        clock,
        env.otpTtlMs,
    );
    const verifyOneTimeCode = new VerifyOneTimeCode(
        otpChallengeStore,
        userRepository,
        tokenSigner,
        clock,
    );
    const verifyEmail = new VerifyEmail(otpChallengeStore, userRepository);
    const resendOneTimeCode = new ResendOneTimeCode(
        otpChallengeStore,
        userRepository,
        otpCodeGenerator,
        otpDeliveryService,
        clock,
        env.otpTtlMs,
        env.otpResendCooldownMs,
    );
    const getCurrentUser = new GetCurrentUser(userRepository);
    const acceptInvite = new AcceptInvite(
        userRepository,
        passwordHasher,
        inviteTokenService,
        clock,
    );

    const authController = new AuthController(
        authenticateUser,
        verifyOneTimeCode,
        verifyEmail,
        resendOneTimeCode,
        getCurrentUser,
        acceptInvite,
        new UpdateOwnProfile(userRepository),
        new RequestEmergencyAccess(userRepository, emergencyRequests, idGenerator, clock),
        new RequestAccess(
            accessRequests,
            userRepository,
            idGenerator,
            clock,
            env.allowedSignupDomains,
        ),
        new ChangeOwnPassword(userRepository, passwordHasher, passwordChangeNotifier),
        new RequestPasswordReset(
            userRepository,
            inviteTokenService,
            passwordResetDelivery,
            clock,
            env.appBaseUrl,
            env.passwordResetTtlMs,
        ),
        new ResetPassword(
            userRepository,
            passwordHasher,
            inviteTokenService,
            passwordChangeNotifier,
            clock,
        ),
        {
            name: SESSION_COOKIE_NAME,
            maxAgeMs: env.sessionCookieMaxAgeMs,
            secure: env.nodeEnv === 'production',
        },
    );

    // Shared so approving an access request goes through the same invite path
    // the admin's own "Invite user" button uses.
    const inviteUser = new InviteUser(
        userRepository,
        idGenerator,
        inviteTokenService,
        inviteDeliveryService,
        clock,
        env.appBaseUrl,
        env.inviteTtlMs,
    );

    const userController = new UserController(
        new ListUsers(userRepository),
        new GetUserStats(userRepository),
        inviteUser,
        new UpdateUser(userRepository),
        new SetUserStatus(userRepository),
        new ListEmergencyAccessRequests(emergencyRequests),
        new DecideEmergencyAccessRequest(emergencyRequests, clock, env.emergencyGrantTtlMs),
        new ListAccessRequests(accessRequests),
        new DecideAccessRequest(accessRequests, inviteUser, clock),
        new ResendInvite(
            userRepository,
            inviteTokenService,
            inviteDeliveryService,
            clock,
            env.appBaseUrl,
            env.inviteTtlMs,
        ),
    );

    const requireAuth = createRequireAuth(tokenSigner, SESSION_COOKIE_NAME, getCurrentUser);

    return { setupController, authController, userController, requireAuth };
}
