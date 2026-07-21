import { AuthProfileEntity } from '../infrastructure/persistence/typeorm/auth-profile.entity';

export const AUTH_PROFILE_REPOSITORY = Symbol('AUTH_PROFILE_REPOSITORY');

export interface IAuthProfileRepository {
    save(profile: {
        id: string;
        name: string;
        description?: string;
        createdAt: Date;
        updatedAt: Date;
    }): Promise<AuthProfileEntity>;
    findById(id: string): Promise<AuthProfileEntity | null>;
    findByName(name: string): Promise<AuthProfileEntity | null>;
    findAll(): Promise<AuthProfileEntity[]>;
}
