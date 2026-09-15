export interface OutboundEmail {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export interface Mailer {
    send(email: OutboundEmail): Promise<void>;
}
