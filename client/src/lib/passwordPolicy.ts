/**
 * Mirrors server/src/domain/policies/passwordPolicy.ts. This copy exists only
 * to give immediate feedback while typing — the server is the authority and
 * re-checks every password it is given.
 */
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_HINT = 'Minimum 12 characters, including one number and one symbol.';

export function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one symbol.';
  return null;
}
