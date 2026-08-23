import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IAuthProfileRepository } from '@features/auth/domain/auth-profile.repository';
import { AuthProfileEntity } from './auth-profile.entity';

@Injectable()
export class AuthProfileRepository
    extends Repository<AuthProfileEntity>
    implements IAuthProfileRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(AuthProfileEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<AuthProfileEntity | null> {
        return this.findOneBy({ id });
    }

    public async findByName(name: string): Promise<AuthProfileEntity | null> {
        return this.findOneBy({ name });
    }

    public async findAll(): Promise<AuthProfileEntity[]> {
        return this.find();
    }
}
