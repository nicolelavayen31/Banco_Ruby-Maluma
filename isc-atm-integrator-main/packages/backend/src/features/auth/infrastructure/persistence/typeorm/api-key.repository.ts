import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IApiKeyRepository } from '@features/auth/domain/api-key.repository';
import { ApiKeyEntity } from './api-key.entity';

@Injectable()
export class ApiKeyRepository
    extends Repository<ApiKeyEntity>
    implements IApiKeyRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(ApiKeyEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<ApiKeyEntity | null> {
        return this.findOneBy({ id });
    }

    public async findByHash(keyHash: string): Promise<ApiKeyEntity | null> {
        return this.findOneBy({ keyHash });
    }

    public async findAllByAgreement(
        agreementId: string,
        page: number,
        limit: number,
    ) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.findAndCount({
            where: { agreementId, deletedAt: null as unknown as undefined },
            skip,
            take: limit,
        });
        return { items, total, page, limit };
    }
}
