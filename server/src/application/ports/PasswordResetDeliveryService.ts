export interface PasswordResetDeliveryService {
    deliver(email: string, resetUrl: string): Promise<void>;
}
