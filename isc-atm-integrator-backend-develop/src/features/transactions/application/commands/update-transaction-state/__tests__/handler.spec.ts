import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ResilienceStatesManager } from 'nestjs-resilience';
import { UpdateTransactionStateHandler } from '../handler';
import { UpdateTransactionStateCommand } from '../command';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import { InMemoryTransactionRepository } from '@features/transactions/infrastructure/persistence/__tests__/in-memory/transaction.repository';
import { InMemoryBankAccountRepository } from '@features/accounts/infrastructure/persistence/__tests__/in-memory/bank-account.repository';
import { CacheResultService } from '@core/cache/cache-result.service';
import { OutboxService } from '@shared/outbox';
import {
    Transaction,
    TRANSACTION_STATE,
    TRANSACTION_TYPE,
} from '@features/transactions/domain/transaction';
import {
    BankAccount,
    ACCOUNT_TYPE,
    ACCOUNT_STATE,
} from '@features/accounts/domain/account';

function mockCacheResult(): CacheResultService {
    return { clear: () => Promise.resolve() } as unknown as CacheResultService;
}

describe('UpdateTransactionStateHandler', () => {
    let handler: UpdateTransactionStateHandler;
    let txRepo: InMemoryTransactionRepository;
    let accountRepo: InMemoryBankAccountRepository;
    let outboxSave: jest.Mock;

    beforeEach(async () => {
        txRepo = new InMemoryTransactionRepository();
        accountRepo = new InMemoryBankAccountRepository();
        outboxSave = jest.fn().mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateTransactionStateHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                { provide: BANK_ACCOUNT_REPOSITORY, useValue: accountRepo },
                { provide: CacheResultService, useValue: mockCacheResult() },
                { provide: OutboxService, useValue: { save: outboxSave } },
            ],
        }).compile();

        handler = module.get(UpdateTransactionStateHandler);
    });

    afterEach(async () => {
        txRepo.reset();
        accountRepo.reset();
        await ResilienceStatesManager.getInstance().reset();
    });

    function seedAccount(id: string, balance: number): void {
        accountRepo.seed([
            BankAccount.Builder.setId(id)
                .setReference(id)
                .setType(ACCOUNT_TYPE.CHECKING)
                .setBalance(balance)
                .setState(ACCOUNT_STATE.ACTIVE)
                .setAgreementId('agr-1')
                .setCreatedAt(new Date())
                .setUpdatedAt(new Date())
                .build(),
        ]);
    }

    function seedTransaction(overrides: {
        type: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
        amount: number;
        state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE];
    }): void {
        txRepo.seed([
            Transaction.Builder.setId('tx-1')
                .setOperation('transfer')
                .setState(overrides.state)
                .setDescription('Test transaction')
                .setBankAccountId('acc-1')
                .setAmount(overrides.amount)
                .setType(overrides.type)
                .setCreatedAt(new Date())
                .setUpdatedAt(new Date())
                .build(),
        ]);
    }

    describe('pending -> success', () => {
        it('decreases the balance for a debit', async () => {
            seedAccount('acc-1', 10000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'pending' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'success'),
            );

            const account = await accountRepo.findById('acc-1');
            expect(account!.balance).toBe(5000);
        });

        it('increases the balance for a credit', async () => {
            seedAccount('acc-1', 10000);
            seedTransaction({ type: 'credit', amount: 5000, state: 'pending' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'success'),
            );

            const account = await accountRepo.findById('acc-1');
            expect(account!.balance).toBe(15000);
        });
    });

    describe('pending -> cancelled', () => {
        it('leaves the balance untouched', async () => {
            seedAccount('acc-1', 10000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'pending' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'cancelled'),
            );

            const account = await accountRepo.findById('acc-1');
            expect(account!.balance).toBe(10000);
        });
    });

    describe('success -> reversed', () => {
        it('restores the balance for a previously applied debit', async () => {
            seedAccount('acc-1', 5000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'success' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'reversed'),
            );

            const account = await accountRepo.findById('acc-1');
            expect(account!.balance).toBe(10000);
        });

        it('removes the balance for a previously applied credit', async () => {
            seedAccount('acc-1', 15000);
            seedTransaction({ type: 'credit', amount: 5000, state: 'success' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'reversed'),
            );

            const account = await accountRepo.findById('acc-1');
            expect(account!.balance).toBe(10000);
        });

        it('persists the reversed state and includes previousState in the outbox event', async () => {
            seedAccount('acc-1', 5000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'success' });

            await handler.execute(
                new UpdateTransactionStateCommand('tx-1', 'reversed'),
            );

            const saved = await txRepo.findById('tx-1');
            expect(saved!.state).toBe('reversed');
            expect(outboxSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'transaction.state_changed',
                    payload: expect.objectContaining({
                        transaction: expect.objectContaining({
                            state: 'reversed',
                            previousState: 'success',
                        }) as Record<string, unknown>,
                    }) as Record<string, unknown>,
                }),
            );
        });
    });

    describe('invalid transitions', () => {
        it('rejects success -> success', async () => {
            seedAccount('acc-1', 5000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'success' });

            await expect(
                handler.execute(
                    new UpdateTransactionStateCommand('tx-1', 'success'),
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('rejects reversed -> success', async () => {
            seedAccount('acc-1', 5000);
            seedTransaction({ type: 'debit', amount: 5000, state: 'reversed' });

            await expect(
                handler.execute(
                    new UpdateTransactionStateCommand('tx-1', 'success'),
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('rejects cancelled -> reversed', async () => {
            seedAccount('acc-1', 5000);
            seedTransaction({
                type: 'debit',
                amount: 5000,
                state: 'cancelled',
            });

            await expect(
                handler.execute(
                    new UpdateTransactionStateCommand('tx-1', 'reversed'),
                ),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('not found', () => {
        it('throws when the transaction does not exist', async () => {
            await expect(
                handler.execute(
                    new UpdateTransactionStateCommand('nonexistent', 'success'),
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws when the bank account does not exist', async () => {
            seedTransaction({ type: 'debit', amount: 5000, state: 'pending' });

            await expect(
                handler.execute(
                    new UpdateTransactionStateCommand('tx-1', 'success'),
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
