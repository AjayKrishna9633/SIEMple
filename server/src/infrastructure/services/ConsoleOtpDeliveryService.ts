import { OtpDeliveryService } from '../../application/ports/OtpDeliveryService';

// Stand-in until a real email/SMS provider is wired up (see
// infrastructure/external-services/) — logs the code instead of actually
// delivering it. Replace this with a real implementation before this ever
// runs somewhere a developer isn't watching the server console.
export class ConsoleOtpDeliveryService implements OtpDeliveryService {
    async deliver(email: string, code: string): Promise<void> {
        console.log(`[OTP] One-time code for ${email}: ${code}`);
    }
}
