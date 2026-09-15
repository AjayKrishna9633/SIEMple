export type EmergencyAccessStatus = 'pending' | 'approved' | 'denied' | 'used';

export interface EmergencyAccessRequestProps {
    id: string;
    userId: string;
    reason: string;
    status?: EmergencyAccessStatus;
    requestedAt?: Date;
    decidedAt?: Date | null;
    decidedByUserId?: string | null;
    grantExpiresAt?: Date | null;
}

/**
 * A request to sign in without the emailed one-time code. Approval waives the
 * second factor only — the password is still checked by AuthenticateUser — so
 * an approved request is worthless to anyone who cannot already authenticate.
 */
export class EmergencyAccessRequest {
    private readonly id: string;
    private readonly userId: string;
    private reason: string;
    private status: EmergencyAccessStatus;
    private readonly requestedAt: Date;
    private decidedAt: Date | null;
    private decidedByUserId: string | null;
    private grantExpiresAt: Date | null;

    constructor(props: EmergencyAccessRequestProps) {
        if (!props.id) {
            throw new Error('Emergency access request id is required');
        }
        if (!props.userId) {
            throw new Error('Emergency access request userId is required');
        }
        if (!props.reason?.trim()) {
            throw new Error('A reason is required');
        }

        this.id = props.id;
        this.userId = props.userId;
        this.reason = props.reason.trim();
        this.status = props.status ?? 'pending';
        this.requestedAt = props.requestedAt ?? new Date();
        this.decidedAt = props.decidedAt ?? null;
        this.decidedByUserId = props.decidedByUserId ?? null;
        this.grantExpiresAt = props.grantExpiresAt ?? null;
    }

    getId(): string {
        return this.id;
    }

    getUserId(): string {
        return this.userId;
    }

    getReason(): string {
        return this.reason;
    }

    getStatus(): EmergencyAccessStatus {
        return this.status;
    }

    getRequestedAt(): Date {
        return this.requestedAt;
    }

    getDecidedAt(): Date | null {
        return this.decidedAt;
    }

    getDecidedByUserId(): string | null {
        return this.decidedByUserId;
    }

    getGrantExpiresAt(): Date | null {
        return this.grantExpiresAt;
    }

    approve(adminUserId: string, now: Date, grantTtlMs: number): void {
        if (this.status !== 'pending') {
            throw new Error('This request has already been decided');
        }
        this.status = 'approved';
        this.decidedAt = now;
        this.decidedByUserId = adminUserId;
        this.grantExpiresAt = new Date(now.getTime() + grantTtlMs);
    }

    deny(adminUserId: string, now: Date): void {
        if (this.status !== 'pending') {
            throw new Error('This request has already been decided');
        }
        this.status = 'denied';
        this.decidedAt = now;
        this.decidedByUserId = adminUserId;
    }

    /** Restating the reason keeps one open request per user instead of stacking duplicates. */
    restate(reason: string): void {
        if (this.status !== 'pending') {
            throw new Error('This request has already been decided');
        }
        if (!reason.trim()) {
            throw new Error('A reason is required');
        }
        this.reason = reason.trim();
    }

    isGrantUsable(now: Date): boolean {
        return (
            this.status === 'approved' && this.grantExpiresAt !== null && now <= this.grantExpiresAt
        );
    }

    /** Burns the grant so a single approval cannot be reused. */
    consume(): void {
        if (this.status !== 'approved') {
            throw new Error('This request has no usable grant');
        }
        this.status = 'used';
    }
}
