import { AuthRefreshTokenEntity } from '../infrastructure/persistence/typeorm/auth-refresh-token.entity';

export const AUTH_REFRESH_TOKEN_REPOSITORY = Symbol(
    'AUTH_REFRESH_TOKEN_REPOSITORY',
);

export interface IAuthRefreshTokenRepository {
    save(token: {
        id: string;
        tokenHash: string;
        expiresAt: Date;
        userId: string;
        createdAt: Date;
    }): Promise<AuthRefreshTokenEntity>;
    findByHash(tokenHash: string): Promise<AuthRefreshTokenEntity | null>;
    deleteByUserId(userId: string): Promise<void>;
    delete(id: string): Promise<void>;
}
