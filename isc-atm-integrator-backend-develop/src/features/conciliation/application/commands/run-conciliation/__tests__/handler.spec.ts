import { Test, TestingModule } from '@nestjs/testing';
import { RunConciliationHandler } from '../handler';
import { RunConciliationCommand } from '../command';
import { CONCILIATION_REPOSITORY } from '../../../../domain/conciliation.repository';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import { InMemoryConciliationRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { InMemoryTransactionRepository } from '@features/transactions/infrastructure/persistence/__tests__/in-memory/transaction.repository';
import {
    Transaction,
    TRANSACTION_OPERATION,
    TRANSACTION_STATE,
} from '@features/transactions/domain/transaction';
import { OutboxService } from '@shared/outbox';
import { BankAccount } from '@features/accounts/domain/account';
import { EventEmitter2 } from '@nestjs/event-emitter';

function buildTx(
    overrides: Partial<{
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
    }>,
): Transaction {
    const now = new Date();
    return Transaction.Builder.setId(overrides.id ?? crypto.randomUUID())
        .setAmount(overrides.amount)
        .setCorrelationId(overrides.correlationId)
        .setSourceBank(overrides.sourceBank ?? 'bank_a')
        .setOperation(
            (overrides.operation ??
                TRANSACTION_OPERATION.WITHDRAWAL) as keyof typeof TRANSACTION_OPERATION,
        )
        .setState(
            (overrides.state ??
                TRANSACTION_STATE.SUCCESS) as keyof typeof TRANSACTION_STATE,
        )
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
    let outboxSave: jest.Mock;

    let accountRepo: { findById: jest.Mock };

    beforeEach(async () => {
        txRepo = new InMemoryTransactionRepository();
        conciliationRepo = new InMemoryConciliationRepository();
        outboxSave = jest.fn().mockResolvedValue(undefined);
        accountRepo = {
            findById: jest
                .fn()
                .mockResolvedValue(
                    BankAccount.Builder.setId(crypto.randomUUID())
                        .setReference('ACC')
                        .setType('checking')
                        .setBalance(0)
                        .setState('active')
                        .setAgreementId('agr-1')
                        .setCreatedAt(new Date())
                        .setUpdatedAt(new Date())
                        .build(),
                ),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RunConciliationHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                {
                    provide: CONCILIATION_REPOSITORY,
                    useValue: conciliationRepo,
                },
                { provide: BANK_ACCOUNT_REPOSITORY, useValue: accountRepo },
                {
                    provide: OutboxService,
                    useValue: { save: outboxSave },
                },
                {
                    provide: EventEmitter2,
                    useValue: { emit: jest.fn() },
                },
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

        const matches = await conciliationRepo.findMatchesByConciliationId(
            all.items[0].id,
        );
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
        expect(
            result.data.summary.matched + result.data.summary.discrepancies,
        ).toBe(1);
        expect(result.data.summary.missing).toBe(1);
    });

    describe('state as part of the match', () => {
        it('labels an amount mismatch with the amount_mismatch reason code', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 2000,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 2500,
                }),
            ]);

            await handler.execute(new RunConciliationCommand());
            const all = await conciliationRepo.findAll(1, 10);
            const matches = await conciliationRepo.findMatchesByConciliationId(
                all.items[0].id,
            );
            expect(matches[0].status).toBe('amount_mismatch');
        });

        it('flags a state mismatch as a discrepancy when one leg succeeded and the other is still pending', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                    state: TRANSACTION_STATE.SUCCESS,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                    state: TRANSACTION_STATE.PENDING,
                }),
            ]);

            const result = await handler.execute(new RunConciliationCommand());
            expect(result.data.summary.matched).toBe(0);
            expect(result.data.summary.discrepancies).toBe(1);

            const all = await conciliationRepo.findAll(1, 10);
            const matches = await conciliationRepo.findMatchesByConciliationId(
                all.items[0].id,
            );
            expect(matches[0].status).toBe('state_mismatch');
        });

        it('flags a state mismatch when one leg was reversed and the other is still success', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                    state: TRANSACTION_STATE.REVERSED,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                    state: TRANSACTION_STATE.SUCCESS,
                }),
            ]);

            const result = await handler.execute(new RunConciliationCommand());
            expect(result.data.summary.discrepancies).toBe(1);
        });

        it('treats both legs reversed as matched', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                    state: TRANSACTION_STATE.REVERSED,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                    state: TRANSACTION_STATE.REVERSED,
                }),
            ]);

            const result = await handler.execute(new RunConciliationCommand());
            expect(result.data.summary.matched).toBe(1);
            expect(result.data.summary.discrepancies).toBe(0);
        });

        it('flags both legs still pending as a state mismatch, not matched', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                    state: TRANSACTION_STATE.PENDING,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                    state: TRANSACTION_STATE.PENDING,
                }),
            ]);

            const result = await handler.execute(new RunConciliationCommand());
            expect(result.data.summary.matched).toBe(0);
            expect(result.data.summary.discrepancies).toBe(1);
            expect(result.data.summary.missing).toBe(0);
        });

        it('matches a cancelled leg against a reversed leg', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                    state: TRANSACTION_STATE.CANCELLED,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                    state: TRANSACTION_STATE.REVERSED,
                }),
            ]);

            const result = await handler.execute(new RunConciliationCommand());
            expect(result.data.summary.matched).toBe(1);
            expect(result.data.summary.discrepancies).toBe(0);
        });
    });

    describe('conciliation result notification', () => {
        it('emits transaction.completed with conciliationState "match" for a matched pair', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 1000,
                }),
            ]);

            await handler.execute(new RunConciliationCommand());
            expect(outboxSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'transaction.completed',
                    payload: expect.objectContaining({
                        transaction: expect.objectContaining({
                            conciliationState: 'match',
                        }) as Record<string, unknown>,
                    }) as Record<string, unknown>,
                }),
            );
        });

        it('emits transaction.conciliation_mismatch with conciliationState "mismatch" for a discrepancy', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 2000,
                }),
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_b',
                    amount: 2500,
                }),
            ]);

            await handler.execute(new RunConciliationCommand());
            expect(outboxSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'transaction.conciliation_mismatch',
                    payload: expect.objectContaining({
                        transaction: expect.objectContaining({
                            conciliationState: 'mismatch',
                        }) as Record<string, unknown>,
                    }) as Record<string, unknown>,
                }),
            );
        });

        it('does not emit anything for a structurally missing counterpart', async () => {
            const cid = corrId();
            txRepo.seed([
                buildTx({
                    correlationId: cid,
                    sourceBank: 'bank_a',
                    amount: 1000,
                }),
            ]);

            await handler.execute(new RunConciliationCommand());
            expect(outboxSave).not.toHaveBeenCalled();
        });
    });
});
