import { InviteDeliveryService } from '../../application/ports/InviteDeliveryService';

// Stand-in used when no Resend key is configured, so local dev works without
// an email provider. Logs the link instead of actually delivering it.
export class ConsoleInviteDeliveryService implements InviteDeliveryService {
    async deliver(email: string, inviteUrl: string): Promise<void> {
        console.log(`[INVITE] Invitation for ${email}: ${inviteUrl}`);
    }
}
