import { AccessRequest } from '../../domain/entities/AccessRequest';
import { AccessRequestRepository } from '../../domain/repositories/AccessRequestRepository';

export class ListAccessRequests {
    constructor(private readonly accessRequests: AccessRequestRepository) {}

    async execute(): Promise<AccessRequest[]> {
        return this.accessRequests.listPending();
    }
}
