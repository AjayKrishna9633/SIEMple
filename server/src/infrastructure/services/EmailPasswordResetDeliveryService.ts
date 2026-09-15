import { PasswordResetDeliveryService } from '../../application/ports/PasswordResetDeliveryService';
import { Mailer } from './Mailer';
import { renderEmailShell } from './emailTemplate';

export class EmailPasswordResetDeliveryService implements PasswordResetDeliveryService {
    constructor(private readonly mailer: Mailer) {}

    async deliver(email: string, resetUrl: string): Promise<void> {
        await this.mailer.send({
            to: email,
            subject: 'Reset your SIEMple password',
            html: renderEmailShell(`
    <p style="color:#8593a8;font-size:14px;text-align:center;margin:0 0 20px">
      Someone asked to reset the password for your SIEMple account.
      Use the link below to choose a new one:
    </p>
    <div style="text-align:center">
      <a href="${resetUrl}" style="display:inline-block;background:#7e93c4;color:#141d2b;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px">Reset Password</a>
    </div>
    <p style="color:#5b6b82;font-size:12px;text-align:center;margin:20px 0 0">
      This link expires in 1 hour and can be used once. If you didn't request it,
      ignore this email — your password will not change.
    </p>`),
            text: `Reset your SIEMple password here: ${resetUrl} (expires in 1 hour, single use). If you didn't request it, ignore this email.`,
        });
    }
}
