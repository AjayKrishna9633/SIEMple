export interface TokenPayload {
    userId: string;
    role: string;
}

export interface TokenSigner {
    sign(payload: TokenPayload): string;
    verify(token: string): TokenPayload | null;
}
