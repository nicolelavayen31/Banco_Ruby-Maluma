import { IAuthUserRepository } from '../../../../domain/auth-user.repository';
import { AuthUserEntity } from '../../typeorm/auth-user.entity';
import { AuthUser } from '../../../../domain/auth-user';

export class InMemoryAuthUserRepository implements IAuthUserRepository {
    private users: Map<string, AuthUserEntity> = new Map();
    private permissions: Map<string, string[]> = new Map();

    public async save(user: AuthUser): Promise<AuthUserEntity> {
        const entity = new AuthUserEntity();
        entity.id = user.id;
        entity.email = user.email;
        entity.passwordHash = user.passwordHash;
        entity.name = user.name;
        entity.state = user.state;
        entity.agreementId = user.agreementId;
        entity.createdAt = user.createdAt;
        entity.updatedAt = user.updatedAt;
        entity.deletedAt = user.deletedAt;
        this.users.set(entity.id, entity);
        return entity;
    }

    public async findById(id: string): Promise<AuthUserEntity | null> {
        return this.users.get(id) ?? null;
    }

    public async findByEmail(email: string): Promise<AuthUserEntity | null> {
        for (const user of this.users.values()) {
            if (user.email === email) return user;
        }
        return null;
    }

    public async findAll(page: number, limit: number): Promise<{
        items: AuthUserEntity[];
        total: number;
        page: number;
        limit: number;
    }> {
        const all = Array.from(this.users.values());
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return { items, total: all.length, page, limit };
    }

    public async findPermissionsByUserId(userId: string): Promise<string[]> {
        return this.permissions.get(userId) ?? [];
    }

    public seed(users: AuthUser[], permissions?: Record<string, string[]>): void {
        for (const user of users) {
            const entity = new AuthUserEntity();
            entity.id = user.id;
            entity.email = user.email;
            entity.passwordHash = user.passwordHash;
            entity.name = user.name;
            entity.state = user.state;
            entity.agreementId = user.agreementId;
            entity.createdAt = user.createdAt;
            entity.updatedAt = user.updatedAt;
            entity.deletedAt = user.deletedAt;
            this.users.set(entity.id, entity);
        }
        if (permissions) {
            for (const [userId, perms] of Object.entries(permissions)) {
                this.permissions.set(userId, perms);
            }
        }
    }

    public reset(): void {
        this.users.clear();
        this.permissions.clear();
    }
}
