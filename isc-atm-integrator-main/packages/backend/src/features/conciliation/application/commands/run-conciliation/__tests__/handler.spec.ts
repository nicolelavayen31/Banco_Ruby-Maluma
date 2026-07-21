import { Test, TestingModule } from '@nestjs/testing';
import { RunConciliationHandler } from '../handler';
import { RunConciliationCommand } from '../command';
import { CONCILIATION_REPOSITORY } from '../../../../domain/conciliation.repository';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import { InMemoryConciliationRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { InMemoryTransactionRepository } from '@features/transactions/infrastructure/persistence/__tests__/in-memory/transaction.repository';
import { Transaction, TRANSACTION_OPERATION, TRANSACTION_STATE } from '@features/transactions/domain/transaction';

const nonNullAmount = (tx: { amount?: number }): number => tx.amount ?? 0;

function buildTx(overrides: Partial<{
    id: string;
    amount: number;
    correlationId: string;
    sourceBank: string;
    operation: string;
    state: string;
    description: string;
    bankAccountId: string;
    createdAt: Date;
    updatedAt: Date;
}>): Transaction {
    const now = new Date();
    return Transaction.Builder
        .setId(overrides.id ?? crypto.randomUUID())
        .setAmount(overrides.amount)
        .setCorrelationId(overrides.correlationId)
        .setSourceBank(overrides.sourceBank ?? 'bank_a')
        .setOperation((overrides.operation ?? TRANSACTION_OPERATION.WITHDRAWAL) as keyof typeof TRANSACTION_OPERATION)
        .setState((overrides.state ?? TRANSACTION_STATE.SUCCESS) as keyof typeof TRANSACTION_STATE)
        .setDescription(overrides.description ?? 'test tx')
        .setBankAccountId(overrides.bankAccountId ?? crypto.randomUUID())
        .setCreatedAt(overrides.createdAt ?? now)
        .setUpdatedAt(overrides.updatedAt ?? now)
        .build();
}

function corrId(): string {
    return crypto.randomUUID();
}

describe('RunConciliationHandler', () => {
    let handler: RunConciliationHandler;
    let txRepo: InMemoryTransactionRepository;
    let conciliationRepo: InMemoryConciliationRepository;

    beforeEach(async () => {
        txRepo = new InMemoryTransactionRepository();
        conciliationRepo = new InMemoryConciliationRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RunConciliationHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                { provide: CONCILIATION_REPOSITORY, useValue: conciliationRepo },
            ],
        }).compile();

        handler = module.get(RunConciliationHandler);
    });

    afterEach(() => {
        txRepo.reset();
        conciliationRepo.reset();
    });

    it('should handle empty transaction sets', async () => {
        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(0);
        expect(result.data.summary.discrepancies).toBe(0);
        expect(result.data.summary.missing).toBe(0);
        expect(result.data.status).toBe('completed');
    });

    it('should match transactions with same correlationId and amount', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 1000 }),
            buildTx({ correlationId: cid, sourceBank: 'bank_b', amount: 1000 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(1);
        expect(result.data.summary.discrepancies).toBe(0);
        expect(result.data.summary.missing).toBe(0);
    });

    it('should detect discrepancies when amounts differ', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 2000 }),
            buildTx({ correlationId: cid, sourceBank: 'bank_b', amount: 2500 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(0);
        expect(result.data.summary.discrepancies).toBe(1);
        expect(result.data.summary.missing).toBe(0);
    });

    it('should detect missing bank_b transactions', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 1000 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(0);
        expect(result.data.summary.discrepancies).toBe(0);
        expect(result.data.summary.missing).toBe(1);
    });

    it('should detect missing bank_a transactions', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_b', amount: 1000 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(0);
        expect(result.data.summary.discrepancies).toBe(0);
        expect(result.data.summary.missing).toBe(1);
    });

    it('should handle a mixed scenario', async () => {
        const c1 = corrId();
        const c2 = corrId();
        const c3 = corrId();
        const c4 = corrId();

        txRepo.seed([
            buildTx({ correlationId: c1, sourceBank: 'bank_a', amount: 1000 }),
            buildTx({ correlationId: c1, sourceBank: 'bank_b', amount: 1000 }),
            buildTx({ correlationId: c2, sourceBank: 'bank_a', amount: 2000 }),
            buildTx({ correlationId: c2, sourceBank: 'bank_b', amount: 2500 }),
            buildTx({ correlationId: c3, sourceBank: 'bank_a', amount: 3000 }),
            buildTx({ correlationId: c4, sourceBank: 'bank_b', amount: 1500 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(1);
        expect(result.data.summary.discrepancies).toBe(1);
        expect(result.data.summary.missing).toBe(2);
    });

    it('should ignore transactions without correlationId', async () => {
        txRepo.seed([
            buildTx({ sourceBank: 'bank_a', amount: 1000 }),
            buildTx({ sourceBank: 'bank_b', amount: 1000 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(0);
        expect(result.data.summary.discrepancies).toBe(0);
        expect(result.data.summary.missing).toBe(0);
    });

    it('should create conciliation with correct status and timestamp', async () => {
        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.status).toBe('completed');
        expect(result.data.runAt).toBeInstanceOf(Date);
        expect(result.metadata.statusCode).toBe(201);
        expect(result.metadata.message).toBe('Conciliation completed');
    });

    it('should persist matches to repository', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 1000 }),
            buildTx({ correlationId: cid, sourceBank: 'bank_b', amount: 1000 }),
        ]);

        await handler.execute(new RunConciliationCommand());
        const all = await conciliationRepo.findAll(1, 10);
        expect(all.total).toBe(1);

        const matches = await conciliationRepo.findMatchesByConciliationId(all.items[0].id);
        expect(matches.length).toBe(1);
        expect(matches[0].status).toBe('matched');
    });

    it('should handle multiple bank_a transactions with same correlationId', async () => {
        const cid = corrId();
        txRepo.seed([
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 1000 }),
            buildTx({ correlationId: cid, sourceBank: 'bank_a', amount: 2000 }),
            buildTx({ correlationId: cid, sourceBank: 'bank_b', amount: 1000 }),
        ]);

        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched + result.data.summary.discrepancies).toBe(1);
        expect(result.data.summary.missing).toBe(1);
    });
});
