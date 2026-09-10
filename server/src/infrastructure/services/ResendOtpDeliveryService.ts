import { Resend } from 'resend';
import { OtpDeliveryService } from '../../application/ports/OtpDeliveryService';

export class ResendOtpDeliveryService implements OtpDeliveryService {
    private readonly resend: Resend;

    constructor(
        apiKey: string,
        private readonly fromAddress: string,
    ) {
        this.resend = new Resend(apiKey);
    }

    async deliver(email: string, code: string): Promise<void> {
        const { error } = await this.resend.emails.send({
            from: this.fromAddress,
            to: [email],
            subject: `${code} is your SIEMple verification code`,
            html: this.buildHtml(code),
            text: `Your SIEMple verification code is ${code}. It expires shortly. If you didn't request it, ignore this email.`,
        });

        // The SDK reports API failures on the result rather than throwing.
        if (error) {
            throw new Error(`Failed to send OTP email: ${error.message}`);
        }
    }

    private buildHtml(code: string): string {
        return `
<div style="background:#0b111a;padding:40px 20px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#141d2b;border:1px solid #232f42;border-radius:8px;padding:32px">
    <h1 style="margin:0;color:#a9c1f0;font-size:20px;text-align:center">SIEMple</h1>
    <p style="margin:4px 0 28px;color:#6b7a91;font-size:11px;letter-spacing:3px;text-align:center;text-transform:uppercase">SOC Ops</p>
    <p style="color:#8593a8;font-size:14px;text-align:center;margin:0 0 20px">Use this one-time code to continue:</p>
    <div style="background:#0a0f1a;border:1px solid #232f42;border-radius:6px;padding:18px;text-align:center">
      <span style="color:#e5eaf2;font-size:30px;font-weight:700;letter-spacing:10px;font-family:ui-monospace,'Courier New',monospace">${code}</span>
    </div>
    <p style="color:#5b6b82;font-size:12px;text-align:center;margin:20px 0 0">
      This code expires shortly. If you didn't request it, you can safely ignore this email.
    </p>
  </div>
</div>`.trim();
    }
}
