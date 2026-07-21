import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { BankAccountEntity } from './account.entity';

@Injectable()
export class BankAccountRepository
    extends Repository<BankAccountEntity>
    implements IBankAccountRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(BankAccountEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<BankAccountEntity | null> {
        return this.findOneBy({ id });
    }

    public async findAll(
        page: number,
        limit: number,
        agreementId?: string,
        type?: string,
        state?: string,
    ) {
        const skip = (page - 1) * limit;
        const where: Record<string, unknown> = {};
        if (agreementId) {
            where.agreementId = agreementId;
        }
        if (type) {
            where.type = type;
        }
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
