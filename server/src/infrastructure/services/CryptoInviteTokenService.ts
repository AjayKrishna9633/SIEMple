import { createHash, randomBytes } from 'node:crypto';
import { InviteTokenService } from '../../application/ports/InviteTokenService';

export class CryptoInviteTokenService implements InviteTokenService {
    generate(): string {
        return randomBytes(32).toString('base64url');
    }

    // Stored hashed so a leaked database dump can't be used to accept invites.
    hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
