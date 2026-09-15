import { OtpDeliveryService } from '../../application/ports/OtpDeliveryService';
import { Mailer } from './Mailer';
import { renderEmailShell } from './emailTemplate';

// Provider-agnostic: composes the message and hands it to whatever Mailer
// the composition root injected.
export class EmailOtpDeliveryService implements OtpDeliveryService {
    constructor(private readonly mailer: Mailer) {}

    async deliver(email: string, code: string): Promise<void> {
        await this.mailer.send({
            to: email,
            subject: `${code} is your SIEMple verification code`,
            html: renderEmailShell(`
    <p style="color:#8593a8;font-size:14px;text-align:center;margin:0 0 20px">Use this one-time code to continue:</p>
    <div style="background:#0a0f1a;border:1px solid #232f42;border-radius:6px;padding:18px;text-align:center">
      <span style="color:#e5eaf2;font-size:30px;font-weight:700;letter-spacing:10px;font-family:ui-monospace,'Courier New',monospace">${code}</span>
    </div>
    <p style="color:#5b6b82;font-size:12px;text-align:center;margin:20px 0 0">
      This code expires shortly. If you didn't request it, you can safely ignore this email.
    </p>`),
            text: `Your SIEMple verification code is ${code}. It expires shortly. If you didn't request it, ignore this email.`,
        });
    }
}
