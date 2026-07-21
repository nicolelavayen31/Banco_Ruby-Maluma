import { IAuthRefreshTokenRepository } from '../../../../domain/auth-refresh-token.repository';
import { AuthRefreshTokenEntity } from '../../typeorm/auth-refresh-token.entity';

export class InMemoryAuthRefreshTokenRepository implements IAuthRefreshTokenRepository {
    private tokens: Map<string, AuthRefreshTokenEntity> = new Map();

    public async save(token: {
        id: string;
        tokenHash: string;
        expiresAt: Date;
        userId: string;
        createdAt: Date;
    }): Promise<AuthRefreshTokenEntity> {
        const entity = new AuthRefreshTokenEntity();
        entity.id = token.id;
        entity.tokenHash = token.tokenHash;
        entity.expiresAt = token.expiresAt;
        entity.userId = token.userId;
        entity.createdAt = token.createdAt;
        this.tokens.set(entity.id, entity);
        return entity;
    }

    public async findByHash(tokenHash: string): Promise<AuthRefreshTokenEntity | null> {
        for (const token of this.tokens.values()) {
            if (token.tokenHash === tokenHash) return token;
        }
        return null;
    }

    public async deleteByUserId(userId: string): Promise<void> {
        for (const [id, token] of this.tokens) {
            if (token.userId === userId) this.tokens.delete(id);
        }
    }

    public async delete(id: string): Promise<void> {
        this.tokens.delete(id);
    }

    public seed(tokens: AuthRefreshTokenEntity[]): void {
        for (const t of tokens) {
            this.tokens.set(t.id, t);
        }
    }

    public reset(): void {
        this.tokens.clear();
    }
}
