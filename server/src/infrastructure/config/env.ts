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
} as const;
