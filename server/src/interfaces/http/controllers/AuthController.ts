import type { CookieOptions, Request, Response } from 'express';
import { toUserResponse } from '../presenters/userResponse';
import { AcceptInvite } from '../../../application/use-cases/AcceptInvite';
import { AuthenticateUser } from '../../../application/use-cases/AuthenticateUser';
import { VerifyOneTimeCode } from '../../../application/use-cases/VerifyOneTimeCode';
import { VerifyEmail } from '../../../application/use-cases/VerifyEmail';
import { ResendOneTimeCode } from '../../../application/use-cases/ResendOneTimeCode';
import { GetCurrentUser } from '../../../application/use-cases/GetCurrentUser';
import { UpdateOwnProfile } from '../../../application/use-cases/UpdateOwnProfile';
import { RequestEmergencyAccess } from '../../../application/use-cases/RequestEmergencyAccess';
import { RequestAccess } from '../../../application/use-cases/RequestAccess';
import { ChangeOwnPassword } from '../../../application/use-cases/ChangeOwnPassword';
import { RequestPasswordReset } from '../../../application/use-cases/RequestPasswordReset';
import { ResetPassword } from '../../../application/use-cases/ResetPassword';

/** `krishnaajay802@gmail.com` -> `k•••02@gmail.com` — enough to recognise, not enough to guess. */
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '•••';
    const masked = local.length <= 3 ? `${local.slice(0, 1)}•••` : `${local.slice(0, 1)}•••${local.slice(-2)}`;
    return `${masked}@${domain}`;
}

export interface SessionCookieOptions {
    name: string;
    maxAgeMs: number;
    secure: boolean;
}

export class AuthController {
    constructor(
        private readonly authenticateUser: AuthenticateUser,
        private readonly verifyOneTimeCode: VerifyOneTimeCode,
        private readonly verifyEmail: VerifyEmail,
        private readonly resendOneTimeCode: ResendOneTimeCode,
        private readonly getCurrentUser: GetCurrentUser,
        private readonly acceptInvite: AcceptInvite,
        private readonly updateOwnProfile: UpdateOwnProfile,
        private readonly requestEmergencyAccessUseCase: RequestEmergencyAccess,
        private readonly requestAccessUseCase: RequestAccess,
        private readonly changeOwnPassword: ChangeOwnPassword,
        private readonly requestPasswordReset: RequestPasswordReset,
        private readonly resetPassword: ResetPassword,
        private readonly cookieOptions: SessionCookieOptions,
    ) {}

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            const result = await this.authenticateUser.execute({
                email,
                password,
                ipAddress: req.ip ?? null,
            });

            // An approved emergency grant skips the code and signs in directly.
            if (result.kind === 'signed-in') {
                res.cookie(this.cookieOptions.name, result.token, {
                    ...this.sessionCookieConfig(),
                    maxAge: this.cookieOptions.maxAgeMs,
                });
                res.status(200).json({
                    emergencyAccess: true,
                    user: toUserResponse(result.user),
                });
                return;
            }

            res.status(200).json({ challengeId: result.challengeId });
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };

    requestAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, fullName, reason } = req.body;
            await this.requestAccessUseCase.execute({ email, fullName, reason });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
            return;
        }
        res.status(202).json({
            message: 'Your request has been submitted. An administrator will review it.',
        });
    };

    requestEmergencyAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, reason } = req.body;
            await this.requestEmergencyAccessUseCase.execute({ email, reason });
        } catch (err) {
            // Only input problems surface; a missing account resolves silently
            // so this cannot be used to probe which addresses exist.
            res.status(400).json({ message: (err as Error).message });
            return;
        }
        res.status(202).json({
            message: 'If that account exists, an administrator has been notified.',
        });
    };

    verifyOtp = async (req: Request, res: Response): Promise<void> => {
        try {
            const { challengeId, code } = req.body;
            const { token, user } = await this.verifyOneTimeCode.execute({
                challengeId,
                code,
                ipAddress: req.ip ?? null,
            });

            res.cookie(this.cookieOptions.name, token, {
                ...this.sessionCookieConfig(),
                maxAge: this.cookieOptions.maxAgeMs,
            });

            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };

    verifyEmailAddress = async (req: Request, res: Response): Promise<void> => {
        try {
            const { challengeId, code } = req.body;
            const user = await this.verifyEmail.execute({ challengeId, code });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };

    resendOtp = async (req: Request, res: Response): Promise<void> => {
        try {
            const { challengeId } = req.body;
            const result = await this.resendOneTimeCode.execute({ challengeId });
            res.status(200).json(result);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    me = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.getCurrentUser.execute(req.auth!.userId);
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };

    // Public: confirms the link is live without disclosing the full address —
    // the invitee has to supply that themselves to accept.
    previewInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = typeof req.query.token === 'string' ? req.query.token : '';
            const user = await this.acceptInvite.findPendingInvite(token);
            res.status(200).json({ maskedEmail: maskEmail(user.getEmail()), role: user.getRole() });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    acceptInvitation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, email, username, password } = req.body;
            const user = await this.acceptInvite.execute({ token, email, username, password });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.updateOwnProfile.execute({
                userId: req.auth!.userId,
                username: req.body.username,
            });
            res.status(200).json(toUserResponse(user));
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    changePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { currentPassword, newPassword } = req.body;
            await this.changeOwnPassword.execute({
                userId: req.auth!.userId,
                currentPassword,
                newPassword,
            });
            res.status(204).send();
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    forgotPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.requestPasswordReset.execute({ email: req.body.email ?? '' });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
            return;
        }
        res.status(202).json({
            message: 'If that account exists, a reset link is on its way.',
        });
    };

    checkPasswordReset = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = typeof req.query.token === 'string' ? req.query.token : '';
            await this.resetPassword.findValidReset(token);
            res.status(200).json({ valid: true });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    submitPasswordReset = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, newPassword } = req.body;
            await this.resetPassword.execute({ token, newPassword });
            res.status(204).send();
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    logout = async (_req: Request, res: Response): Promise<void> => {
        // Options must match those used to set it, or the browser keeps the cookie.
        res.clearCookie(this.cookieOptions.name, this.sessionCookieConfig());
        res.status(204).send();
    };

    private sessionCookieConfig(): CookieOptions {
        return {
            httpOnly: true,
            secure: this.cookieOptions.secure,
            sameSite: 'lax',
            path: '/',
        };
    }

}
