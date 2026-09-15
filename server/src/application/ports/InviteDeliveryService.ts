export interface InviteDeliveryService {
    deliver(email: string, inviteUrl: string): Promise<void>;
}
