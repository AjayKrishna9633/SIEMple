import { InviteDeliveryService } from '../../application/ports/InviteDeliveryService';
import { Mailer } from './Mailer';
import { renderEmailShell } from './emailTemplate';

// Provider-agnostic: composes the message and hands it to whatever Mailer
// the composition root injected.
export class EmailInviteDeliveryService implements InviteDeliveryService {
    constructor(private readonly mailer: Mailer) {}

    async deliver(email: string, inviteUrl: string): Promise<void> {
        await this.mailer.send({
            to: email,
            subject: "You've been invited to SIEMple",
            html: renderEmailShell(`
    <p style="color:#8593a8;font-size:14px;text-align:center;margin:0 0 20px">
      An administrator has invited you to join the SIEMple SOC workspace.
      Set your password to activate your account:
    </p>
    <div style="text-align:center">
      <a href="${inviteUrl}" style="display:inline-block;background:#7e93c4;color:#141d2b;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px">Accept Invitation</a>
    </div>
    <p style="color:#5b6b82;font-size:12px;text-align:center;margin:20px 0 0">
      This invitation expires in 7 days. If you weren't expecting it, you can safely ignore this email.
    </p>`),
            text: `An administrator has invited you to join SIEMple. Set your password here: ${inviteUrl} (link expires in 7 days).`,
        });
    }
}
