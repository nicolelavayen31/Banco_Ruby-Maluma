import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IAuthPermissionRepository } from '@features/auth/domain/auth-permission.repository';
import { AuthPermissionEntity } from './auth-permission.entity';

@Injectable()
export class AuthPermissionRepository
    extends Repository<AuthPermissionEntity>
    implements IAuthPermissionRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(AuthPermissionEntity, dataSource.createEntityManager());
    }

    public async findAll(): Promise<AuthPermissionEntity[]> {
        return this.find();
    }

    public async findByProfileId(
        profileId: string,
    ): Promise<AuthPermissionEntity[]> {
        return this.createQueryBuilder('permission')
            .innerJoin(
                'profile_permission',
                'pp',
                'pp.permission_id = permission.id',
            )
            .where('pp.profile_id = :profileId', { profileId })
            .getMany();
    }
}
