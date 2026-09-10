import { randomUUID } from 'node:crypto';
import {
    OtpChallengeStore,
    OtpPurpose,
    PendingOtpChallenge,
} from '../../application/ports/OtpChallengeStore';

interface Challenge {
    userId: string;
    purpose: OtpPurpose;
    code: string;
    expiresAt: number;
    lastSentAt: number;
}

// Ephemeral, single-process store — fine for local dev / a single server
// instance. Swap for a shared store (e.g. Redis) before running multiple
// server instances, since challenges here won't survive a restart or be
// visible across instances. Each challenge is single-attempt: it's
// consumed on the first verify() call regardless of outcome, so a wrong
// guess can't be retried against the same challenge.
export class InMemoryOtpChallengeStore implements OtpChallengeStore {
    private readonly challenges = new Map<string, Challenge>();

    async create(userId: string, purpose: OtpPurpose, code: string, ttlMs: number): Promise<string> {
        const challengeId = randomUUID();
        this.challenges.set(challengeId, {
            userId,
            purpose,
            code,
            expiresAt: Date.now() + ttlMs,
            lastSentAt: Date.now(),
        });
        return challengeId;
    }

    async verify(challengeId: string, purpose: OtpPurpose, code: string): Promise<string | null> {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) return null;

        this.challenges.delete(challengeId);

        if (challenge.purpose !== purpose) return null;
        if (Date.now() > challenge.expiresAt) return null;
        if (challenge.code !== code) return null;

        return challenge.userId;
    }

    async peek(challengeId: string): Promise<PendingOtpChallenge | null> {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) return null;

        if (Date.now() > challenge.expiresAt) {
            this.challenges.delete(challengeId);
            return null;
        }

        return {
            userId: challenge.userId,
            purpose: challenge.purpose,
            lastSentAt: new Date(challenge.lastSentAt),
        };
    }

    async replaceCode(challengeId: string, code: string, ttlMs: number): Promise<void> {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) return;

        challenge.code = code;
        challenge.expiresAt = Date.now() + ttlMs;
        challenge.lastSentAt = Date.now();
    }
}
