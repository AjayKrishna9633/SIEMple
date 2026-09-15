import { PasswordResetDeliveryService } from '../../application/ports/PasswordResetDeliveryService';

// Stand-in used when no email provider is configured.
export class ConsolePasswordResetDeliveryService implements PasswordResetDeliveryService {
    async deliver(email: string, resetUrl: string): Promise<void> {
        console.log(`[PASSWORD RESET] Link for ${email}: ${resetUrl}`);
    }
}
