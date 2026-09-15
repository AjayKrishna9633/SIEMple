import { PasswordChangeNotifier } from '../../application/ports/PasswordChangeNotifier';

// Stand-in used when no email provider is configured.
export class ConsolePasswordChangeNotifier implements PasswordChangeNotifier {
    async notify(email: string): Promise<void> {
        console.log(`[PASSWORD] Password changed for ${email}`);
    }
}
