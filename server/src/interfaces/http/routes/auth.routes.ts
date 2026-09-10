import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

export function createAuthRouter(authController: AuthController): Router {
    const router = Router();
    router.post('/login', authController.login);
    router.post('/verify-otp', authController.verifyOtp);
    router.post('/verify-email', authController.verifyEmailAddress);
    router.post('/resend-otp', authController.resendOtp);
    return router;
}
