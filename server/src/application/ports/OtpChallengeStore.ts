export type OtpPurpose = 'login' | 'email-verification';

export interface PendingOtpChallenge {
    userId: string;
    purpose: OtpPurpose;
    lastSentAt: Date;
}

export interface OtpChallengeStore {
    /** Creates a pending challenge for userId, returns a challengeId. */
    create(userId: string, purpose: OtpPurpose, code: string, ttlMs: number): Promise<string>;

    /**
     * Verifies code against the challenge. Consumes the challenge on success.
     * Returns the userId, or null if invalid/expired/issued for another purpose.
     */
    verify(challengeId: string, purpose: OtpPurpose, code: string): Promise<string | null>;

    /** Reads a pending challenge without consuming it. Returns null if unknown or expired. */
    peek(challengeId: string): Promise<PendingOtpChallenge | null>;

    /** Swaps in a freshly generated code and restarts the challenge's TTL. */
    replaceCode(challengeId: string, code: string, ttlMs: number): Promise<void>;
}
