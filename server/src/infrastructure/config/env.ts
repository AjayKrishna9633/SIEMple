import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function parsePort(raw: string | undefined): number {
    const port = Number(raw ?? 4000);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT: ${raw}`);
    }
    return port;
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parsePort(process.env.PORT),
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    // Keep in sync with jwtExpiresIn above — kept as a separate numeric
    // value so the cookie's maxAge doesn't need to parse jsonwebtoken's
    // duration-string format.
    sessionCookieMaxAgeMs: Number(process.env.SESSION_COOKIE_MAX_AGE_MS ?? 60 * 60 * 1000),
    otpTtlMs: Number(process.env.OTP_TTL_MS ?? 5 * 60 * 1000),
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
} as const;
