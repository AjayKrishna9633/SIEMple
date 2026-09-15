import type { RequestHandler } from 'express';
import type { UserRole } from '../../../domain/entities/User';

// Must run after requireAuth, which is what populates req.auth.
export function requireRole(...allowed: UserRole[]): RequestHandler {
    return (req, res, next) => {
        if (!req.auth || !allowed.includes(req.auth.role as UserRole)) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
