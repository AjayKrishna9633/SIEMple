import { EmergencyAccessRequest } from '../entities/EmergencyAccessRequest';

export interface PendingEmergencyRequest {
    request: EmergencyAccessRequest;
    userEmail: string;
    userName: string;
}

export interface EmergencyAccessRequestRepository {
    save(request: EmergencyAccessRequest): Promise<void>;
    findById(id: string): Promise<EmergencyAccessRequest | null>;
    findPendingByUserId(userId: string): Promise<EmergencyAccessRequest | null>;
    /** The approved, unexpired, unused grant for a user, if any. */
    findUsableGrant(userId: string, now: Date): Promise<EmergencyAccessRequest | null>;
    /** Pending requests joined with who made them, for the admin review panel. */
    listPending(): Promise<PendingEmergencyRequest[]>;
}
