import jwt from 'jsonwebtoken';
import { TokenSigner, TokenPayload } from '../../application/ports/TokenSigner';

export class JwtTokenSigner implements TokenSigner {
    constructor(
        private readonly secret: string,
        private readonly expiresIn: string,
    ) {}

    sign(payload: TokenPayload): string {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'] });
    }

    verify(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.secret) as TokenPayload;
        } catch {
            return null;
        }
    }
}
