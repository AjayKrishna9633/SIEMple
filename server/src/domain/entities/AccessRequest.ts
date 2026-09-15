export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequestProps {
    id: string;
    email: string;
    fullName: string;
    reason: string;
    status?: AccessRequestStatus;
    requestedAt?: Date;
    decidedAt?: Date | null;
    decidedByUserId?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Someone without an account asking for one. Approving it does not create
 * credentials — it triggers the normal invite flow, so the person still proves
 * control of their mailbox and chooses their own password.
 */
export class AccessRequest {
    private readonly id: string;
    private readonly email: string;
    private fullName: string;
    private reason: string;
    private status: AccessRequestStatus;
    private readonly requestedAt: Date;
    private decidedAt: Date | null;
    private decidedByUserId: string | null;

    constructor(props: AccessRequestProps) {
        if (!props.id) {
            throw new Error('Access request id is required');
        }
        if (!EMAIL_REGEX.test(props.email)) {
            throw new Error(`Invalid email: ${props.email}`);
        }
        if (!props.fullName?.trim()) {
            throw new Error('A name is required');
        }
        if (!props.reason?.trim()) {
            throw new Error('A reason is required');
        }

        this.id = props.id;
        this.email = props.email.trim().toLowerCase();
        this.fullName = props.fullName.trim();
        this.reason = props.reason.trim();
        this.status = props.status ?? 'pending';
        this.requestedAt = props.requestedAt ?? new Date();
        this.decidedAt = props.decidedAt ?? null;
        this.decidedByUserId = props.decidedByUserId ?? null;
    }

    getId(): string {
        return this.id;
    }

    getEmail(): string {
        return this.email;
    }

    getFullName(): string {
        return this.fullName;
    }

    getReason(): string {
        return this.reason;
    }

    getStatus(): AccessRequestStatus {
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

    approve(adminUserId: string, now: Date): void {
        this.requirePending();
        this.status = 'approved';
        this.decidedAt = now;
        this.decidedByUserId = adminUserId;
    }

    deny(adminUserId: string, now: Date): void {
        this.requirePending();
        this.status = 'denied';
        this.decidedAt = now;
        this.decidedByUserId = adminUserId;
    }

    /** A repeat request updates the open one rather than queueing a duplicate. */
    restate(fullName: string, reason: string): void {
        this.requirePending();
        if (!fullName.trim() || !reason.trim()) {
            throw new Error('A name and reason are required');
        }
        this.fullName = fullName.trim();
        this.reason = reason.trim();
    }

    private requirePending(): void {
        if (this.status !== 'pending') {
            throw new Error('This request has already been decided');
        }
    }
}
