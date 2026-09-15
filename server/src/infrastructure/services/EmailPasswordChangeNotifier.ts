import { PasswordChangeNotifier } from '../../application/ports/PasswordChangeNotifier';
import { Mailer } from './Mailer';
import { renderEmailShell } from './emailTemplate';

export class EmailPasswordChangeNotifier implements PasswordChangeNotifier {
    constructor(private readonly mailer: Mailer) {}

    async notify(email: string): Promise<void> {
        await this.mailer.send({
            to: email,
            subject: 'Your SIEMple password was changed',
            html: renderEmailShell(`
    <p style="color:#8593a8;font-size:14px;text-align:center;margin:0 0 20px">
      The password for your SIEMple account was just changed.
    </p>
    <div style="background:#0a0f1a;border:1px solid #232f42;border-radius:6px;padding:16px">
      <p style="color:#c3cede;font-size:13px;margin:0;text-align:center">
        If this was you, no action is needed.
      </p>
    </div>
    <p style="color:#5b6b82;font-size:12px;text-align:center;margin:20px 0 0">
      If it wasn't, contact your administrator immediately — someone else may have access to your account.
    </p>`),
            text: "The password for your SIEMple account was just changed. If this wasn't you, contact your administrator immediately.",
        });
    }
}
