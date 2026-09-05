import bcrypt from 'bcrypt';
import { passwordHash } from '../../application/ports/PasswordHasher';

export class BcryptPasswordHasher implements passwordHash {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}