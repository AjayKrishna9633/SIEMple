export const PASSWORD_MIN_LENGTH = 12;

/** Returns a human-readable problem, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!/\d/.test(password)) {
        return 'Password must include at least one number.';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must include at least one symbol.';
    }
    return null;
}

export function assertValidPassword(password: string): void {
    const problem = validatePassword(password);
    if (problem) {
        throw new Error(problem);
    }
}
