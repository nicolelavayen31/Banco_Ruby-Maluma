import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionRepository
    extends Repository<TransactionEntity>
    implements ITransactionRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(TransactionEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<TransactionEntity | null> {
        return this.findOneBy({ id });
    }

    public async findAll(
        page: number,
        limit: number,
        accountId?: string,
        correlationId?: string,
        operation?: string,
        state?: string,
        sourceBank?: string,
    ) {
        const skip = (page - 1) * limit;
        const where: Record<string, unknown> = {};
        if (accountId) {
            where.accountId = accountId;
        }
        if (correlationId) {
            where.correlationId = correlationId;
        }
        if (operation) {
            where.operation = operation;
        }
        if (state) {
            where.state = state;
        }
        if (sourceBank) {
            where.sourceBank = sourceBank;
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
