export interface OtpDeliveryService {
    deliver(email: string, code: string): Promise<void>;
}
