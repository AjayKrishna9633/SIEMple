import { AccessRequest } from '../entities/AccessRequest';

export interface AccessRequestRepository {
    save(request: AccessRequest): Promise<void>;
    findById(id: string): Promise<AccessRequest | null>;
    findPendingByEmail(email: string): Promise<AccessRequest | null>;
    listPending(): Promise<AccessRequest[]>;
}
