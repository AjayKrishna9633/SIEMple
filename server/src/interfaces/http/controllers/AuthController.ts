import type { Request, Response } from 'express';
import { AuthenticateUser } from '../../../application/use-cases/AuthenticateUser';
import { VerifyOneTimeCode } from '../../../application/use-cases/VerifyOneTimeCode';

export interface SessionCookieOptions {
    name: string;
    maxAgeMs: number;
    secure: boolean;
}

export class AuthController {
    constructor(
        private readonly authenticateUser: AuthenticateUser,
        private readonly verifyOneTimeCode: VerifyOneTimeCode,
        private readonly cookieOptions: SessionCookieOptions,
    ) {}

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            const result = await this.authenticateUser.execute({ email, password });
            res.status(200).json(result);
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };

    verifyOtp = async (req: Request, res: Response): Promise<void> => {
        try {
            const { challengeId, code } = req.body;
            const { token, user } = await this.verifyOneTimeCode.execute({ challengeId, code });

            res.cookie(this.cookieOptions.name, token, {
                httpOnly: true,
                secure: this.cookieOptions.secure,
                sameSite: 'lax',
                maxAge: this.cookieOptions.maxAgeMs,
            });

            res.status(200).json({
                id: user.getId(),
                email: user.getEmail(),
                username: user.getUsername(),
                role: user.getRole(),
            });
        } catch (err) {
            res.status(401).json({ message: (err as Error).message });
        }
    };
}
