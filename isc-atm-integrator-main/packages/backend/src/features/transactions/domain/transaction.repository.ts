import { TransactionEntity } from '../infrastructure/persistence/typeorm/transaction.entity';
import { Transaction } from './transaction';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface ITransactionRepository {
    save(transaction: Transaction): Promise<TransactionEntity>;
    findById(id: string): Promise<TransactionEntity | null>;
    findAll(
        page: number,
        limit: number,
        accountId?: string,
        correlationId?: string,
        operation?: string,
        state?: string,
        sourceBank?: string,
    ): Promise<{
        items: TransactionEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
