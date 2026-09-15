import {
    EmergencyAccessRequestRepository,
    PendingEmergencyRequest,
} from '../../domain/repositories/EmergencyAccessRequestRepository';

export class ListEmergencyAccessRequests {
    constructor(private readonly emergencyRequests: EmergencyAccessRequestRepository) {}

    async execute(): Promise<PendingEmergencyRequest[]> {
        return this.emergencyRequests.listPending();
    }
}
