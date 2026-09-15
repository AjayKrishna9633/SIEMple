import { randomInt } from 'node:crypto';
import { OtpCodeGenerator } from '../../application/ports/OtpCodeGenerator';

export class CryptoOtpCodeGenerator implements OtpCodeGenerator {
    generate(): string {
        return randomInt(0, 1_000_000).toString().padStart(6, '0');
    }
}
