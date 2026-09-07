import { randomUUID } from 'node:crypto';
import { OtpChallengeStore } from '../../application/ports/OtpChallengeStore';

interface Challenge {
    userId: string;
    code: string;
    expiresAt: number;
}

// Ephemeral, single-process store — fine for local dev / a single server
// instance. Swap for a shared store (e.g. Redis) before running multiple
// server instances, since challenges here won't survive a restart or be
// visible across instances. Each challenge is single-attempt: it's
// consumed on the first verify() call regardless of outcome, so a wrong
// guess can't be retried against the same challenge.
export class InMemoryOtpChallengeStore implements OtpChallengeStore {
    private readonly challenges = new Map<string, Challenge>();

    async create(userId: string, code: string, ttlMs: number): Promise<string> {
        const challengeId = randomUUID();
        this.challenges.set(challengeId, { userId, code, expiresAt: Date.now() + ttlMs });
        return challengeId;
    }

    async verify(challengeId: string, code: string): Promise<string | null> {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) return null;

        this.challenges.delete(challengeId);

        if (Date.now() > challenge.expiresAt) return null;
        if (challenge.code !== code) return null;

        return challenge.userId;
    }
}
