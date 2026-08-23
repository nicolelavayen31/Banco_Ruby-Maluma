import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { IAuthRefreshTokenRepository } from '@features/auth/domain/auth-refresh-token.repository';
import { AuthRefreshTokenEntity } from './auth-refresh-token.entity';

@Injectable()
export class AuthRefreshTokenRepository
    extends Repository<AuthRefreshTokenEntity>
    implements IAuthRefreshTokenRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(AuthRefreshTokenEntity, dataSource.createEntityManager());
    }

    public async findByHash(
        tokenHash: string,
    ): Promise<AuthRefreshTokenEntity | null> {
        return this.findOneBy({ tokenHash });
    }

    public async deleteByUserId(userId: string): Promise<void> {
        await super.delete({
            userId,
        });
    }

    // @ts-expect-error: domain interface returns void, base Repository returns DeleteResult
    public async delete(id: string): Promise<void> {
        await super.delete({ id });
    }
}
