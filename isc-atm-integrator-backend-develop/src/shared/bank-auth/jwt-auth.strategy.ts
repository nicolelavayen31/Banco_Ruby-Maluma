import jwt from 'jsonwebtoken';
import type { AuthStrategy, AuthRequest } from './auth-strategy.interface';

export class JwtAuthStrategy implements AuthStrategy {
    public readonly type = 'jwt' as const;

    public apply(
        request: AuthRequest,
        config: Record<string, any>,
    ): AuthRequest {
        const secret: string | undefined = config.secret as string | undefined;
        if (!secret) {
            throw new Error(
                'JWT auth strategy requires "secret" in authConfig',
            );
        }

        const token = jwt.sign(
            {
                sub: 'atm-integrator',
                iat: Math.floor(Date.now() / 1000),
            },
            secret,
            { expiresIn: '5m' },
        );

        return {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Bearer ${token}`,
            },
        };
    }
}
