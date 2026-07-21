import { randomUUID } from 'node:crypto';
import { ITransactionRepository } from '../../../../domain/transaction.repository';
import { TransactionEntity } from '../../typeorm/transaction.entity';
import { Transaction, TRANSACTION_STATE } from '../../../../domain/transaction';

export class InMemoryTransactionRepository implements ITransactionRepository {
    private transactions: Map<string, TransactionEntity> = new Map();

    public async save(transaction: Transaction): Promise<TransactionEntity> {
        const entity = new TransactionEntity();
        entity.id = transaction.id;
        entity.amount = transaction.amount;
        entity.operation = transaction.operation;
        entity.type = transaction.type;
        entity.state = transaction.state;
        entity.description = transaction.description;
        entity.bankAccountId = transaction.bankAccountId;
        entity.correlationId = transaction.correlationId;
        entity.sourceBank = transaction.sourceBank;
        entity.createdAt = transaction.createdAt;
        entity.updatedAt = transaction.updatedAt;
        entity.deletedAt = transaction.deletedAt;
        this.transactions.set(entity.id, entity);
        return entity;
    }

    public async findById(id: string): Promise<TransactionEntity | null> {
        return this.transactions.get(id) ?? null;
    }

    public async findAll(
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
    }> {
        let all = Array.from(this.transactions.values());
        if (accountId) all = all.filter(t => t.bankAccountId === accountId);
        if (correlationId) all = all.filter(t => t.correlationId === correlationId);
        if (operation) all = all.filter(t => t.operation === operation);
        if (state) all = all.filter(t => t.state === state);
        if (sourceBank) all = all.filter(t => t.sourceBank === sourceBank);
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return { items, total: all.length, page, limit };
    }

    public seed(transactions: Transaction[]): void {
        for (const tx of transactions) {
            const entity = new TransactionEntity();
            entity.id = tx.id;
            entity.amount = tx.amount;
            entity.operation = tx.operation;
            entity.type = tx.type;
            entity.state = tx.state;
            entity.description = tx.description;
            entity.bankAccountId = tx.bankAccountId;
            entity.correlationId = tx.correlationId;
            entity.sourceBank = tx.sourceBank;
            entity.createdAt = tx.createdAt;
            entity.updatedAt = tx.updatedAt;
            entity.deletedAt = tx.deletedAt;
            this.transactions.set(entity.id, entity);
        }
    }

    public reset(): void {
        this.transactions.clear();
    }
}
