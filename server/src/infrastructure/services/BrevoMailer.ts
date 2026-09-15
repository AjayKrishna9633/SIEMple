import { Mailer, OutboundEmail } from './Mailer';

interface Sender {
    name: string;
    email: string;
}

const DEFAULT_SENDER_NAME = 'SIEMple';

/** Splits a `Name <address@host>` string into the parts Brevo's API expects. */
function parseSender(fromAddress: string): Sender {
    const match = fromAddress.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (!match) {
        return { name: DEFAULT_SENDER_NAME, email: fromAddress.trim() };
    }
    return { name: match[1] || DEFAULT_SENDER_NAME, email: match[2].trim() };
}

export class BrevoMailer implements Mailer {
    private readonly sender: Sender;

    constructor(
        private readonly apiKey: string,
        fromAddress: string,
    ) {
        this.sender = parseSender(fromAddress);
    }

    async send(email: OutboundEmail): Promise<void> {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': this.apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: this.sender,
                to: [{ email: email.to }],
                subject: email.subject,
                htmlContent: email.html,
                textContent: email.text,
            }),
        });

        // Brevo signals failure with the status code, not the body.
        if (!response.ok) {
            throw new Error(`Failed to send email: ${await response.text()}`);
        }
    }
}
