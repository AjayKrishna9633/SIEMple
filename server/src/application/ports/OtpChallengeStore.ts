export interface OtpChallengeStore {
    /** Creates a pending challenge for userId, returns a challengeId. */
    create(userId: string, code: string, ttlMs: number): Promise<string>;

    /** Verifies code against the challenge. Consumes the challenge on success. Returns the userId, or null if invalid/expired. */
    verify(challengeId: string, code: string): Promise<string | null>;
}
