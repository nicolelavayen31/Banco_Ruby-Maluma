import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import { AgreementEntity } from './agreement.entity';

@Injectable()
export class AgreementRepository
    extends Repository<AgreementEntity>
    implements IAgreementRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(AgreementEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<AgreementEntity | null> {
        return this.findOneBy({ id });
    }

    public async findAll(page: number, limit: number, state?: string) {
        const skip = (page - 1) * limit;
        const where: Record<string, unknown> = {};
        if (state) {
            where.state = state;
        }
        const [items, total] = await this.findAndCount({
            skip,
            take: limit,
            where,
        });
        return {
            items,
            total,
            page,
            limit,
        };
    }
}
