import { Router, type RequestHandler } from 'express';
import { AuthController } from '../controllers/AuthController';

export function createAuthRouter(
    authController: AuthController,
    requireAuth: RequestHandler,
): Router {
    const router = Router();
    router.post('/login', authController.login);
    router.post('/verify-otp', authController.verifyOtp);
    router.post('/verify-email', authController.verifyEmailAddress);
    router.post('/resend-otp', authController.resendOtp);
    router.get('/invite', authController.previewInvite);
    router.post('/accept-invite', authController.acceptInvitation);
    router.post('/emergency-access', authController.requestEmergencyAccess);
    router.post('/access-request', authController.requestAccess);
    router.post('/forgot-password', authController.forgotPassword);
    router.get('/password-reset', authController.checkPasswordReset);
    router.post('/reset-password', authController.submitPasswordReset);
    router.get('/me', requireAuth, authController.me);
    router.patch('/me', requireAuth, authController.updateProfile);
    router.post('/me/password', requireAuth, authController.changePassword);
    router.post('/logout', requireAuth, authController.logout);
    return router;
}
