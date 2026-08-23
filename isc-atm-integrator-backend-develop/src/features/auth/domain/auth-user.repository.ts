import { AuthUserEntity } from '../infrastructure/persistence/typeorm/auth-user.entity';
import { AuthUser } from './auth-user';

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');

export interface IAuthUserRepository {
    save(user: AuthUser): Promise<AuthUserEntity>;
    findById(id: string): Promise<AuthUserEntity | null>;
    findByEmail(email: string): Promise<AuthUserEntity | null>;
    findAll(
        page: number,
        limit: number,
    ): Promise<{
        items: AuthUserEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
    findPermissionsByUserId(userId: string): Promise<string[]>;
}
