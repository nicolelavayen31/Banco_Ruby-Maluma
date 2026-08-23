import { AuthPermissionEntity } from '../infrastructure/persistence/typeorm/auth-permission.entity';

export const AUTH_PERMISSION_REPOSITORY = Symbol('AUTH_PERMISSION_REPOSITORY');

export interface IAuthPermissionRepository {
    save(permission: {
        id: string;
        resource: string;
        action: string;
        name: string;
        createdAt: Date;
    }): Promise<AuthPermissionEntity>;
    findAll(): Promise<AuthPermissionEntity[]>;
    findByProfileId(profileId: string): Promise<AuthPermissionEntity[]>;
}
