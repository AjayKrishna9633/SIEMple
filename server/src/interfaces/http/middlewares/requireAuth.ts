import type { RequestHandler } from 'express';
import { GetCurrentUser } from '../../../application/use-cases/GetCurrentUser';
import { TokenPayload, TokenSigner } from '../../../application/ports/TokenSigner';

declare global {
    namespace Express {
        interface Request {
            auth?: TokenPayload;
        }
    }
}

const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

export function createRequireAuth(
    tokenSigner: TokenSigner,
    cookieName: string,
    getCurrentUser: GetCurrentUser,
): RequestHandler {
    return async (req, res, next) => {
        const token = req.cookies?.[cookieName];
        const payload = token ? tokenSigner.verify(token) : null;
        if (!payload) {
            res.status(401).json({ message: NOT_AUTHENTICATED_MESSAGE });
            return;
        }

        try {
            // A valid signature only proves the token was ours when issued. The
            // account may have been blocked, deleted or demoted since, so the
            // role comes from the database rather than the token's claims.
            const user = await getCurrentUser.execute(payload.userId);
            req.auth = { userId: user.getId(), role: user.getRole() };
            next();
        } catch {
            res.status(401).json({ message: NOT_AUTHENTICATED_MESSAGE });
        }
    };
}
