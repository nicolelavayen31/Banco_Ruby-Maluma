import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IAuthUserRepository } from '@features/auth/domain/auth-user.repository';
import { AuthUserEntity } from './auth-user.entity';

@Injectable()
export class AuthUserRepository
    extends Repository<AuthUserEntity>
    implements IAuthUserRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(AuthUserEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<AuthUserEntity | null> {
        return this.findOneBy({ id });
    }

    public async findByEmail(email: string): Promise<AuthUserEntity | null> {
        return this.findOneBy({ email });
    }

    public async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.findAndCount({
            skip,
            take: limit,
        });
        return { items, total, page, limit };
    }

    public async findPermissionsByUserId(userId: string): Promise<string[]> {
        const rows = await this.dataSource.query<{ name: string }[]>(
            `SELECT DISTINCT ap.name
             FROM auth_permission ap
             INNER JOIN profile_permission pp ON pp.permission_id = ap.id
             INNER JOIN user_profile up ON up.profile_id = pp.profile_id
             WHERE up.user_id = $1
             ORDER BY ap.name`,
            [userId],
        );
        return rows.map((r) => r.name);
    }
}
