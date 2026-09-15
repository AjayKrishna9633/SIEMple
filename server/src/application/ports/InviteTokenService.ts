export interface InviteTokenService {
    generate(): string;
    hash(token: string): string;
}
