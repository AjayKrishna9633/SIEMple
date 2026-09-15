import type { User } from '../../../domain/entities/User';

/** Single place the API's user shape is defined, so every endpoint agrees. */
export function toUserResponse(user: User) {
    return {
        id: user.getId(),
        email: user.getEmail(),
        username: user.getUsername(),
        role: user.getRole(),
        status: user.getStatus(),
        isEmailVerified: user.getIsEmailVerified(),
        lastLoginAt: user.getLastLoginAt(),
        lastSignInIp: user.getLastSignInIp(),
        createdAt: user.getCreatedAt(),
    };
}
