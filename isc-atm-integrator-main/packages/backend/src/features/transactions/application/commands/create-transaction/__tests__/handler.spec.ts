import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionHandler } from '../handler';
import { CreateTransactionCommand } from '../command';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import { InMemoryTransactionRepository } from '@features/transactions/infrastructure/persistence/__tests__/in-memory/transaction.repository';
import { InMemoryBankAccountRepository } from '@features/accounts/infrastructure/persistence/__tests__/in-memory/bank-account.repository';
import { CacheResultService } from '@shared/core/cache/cache-result.service';
import { BankAccount, ACCOUNT_TYPE, ACCOUNT_STATE } from '@features/accounts/domain/account';

function mockConfigService(validateBalance: boolean = true): ConfigService {
    return {
        get: (key: string) => {
            if (key === 'features.validateBalance') return validateBalance;
            return undefined;
        },
    } as unknown as ConfigService;
}

function mockCacheResult(): CacheResultService {
    return { clear: () => Promise.resolve() } as unknown as CacheResultService;
}

function makeCmd(overrides: Record<string, unknown>): CreateTransactionCommand {
    return Object.assign(new CreateTransactionCommand(), {
        account_id: 'acc-1',
        operation: 'withdrawal',
        description: 'ATM withdrawal',
        amount: 5000,
        type: 'debit',
        source_bank: 'bank_a',
        ...overrides,
    });
}

describe('CreateTransactionHandler', () => {
    let handler: CreateTransactionHandler;
    let txRepo: InMemoryTransactionRepository;
    let accountRepo: InMemoryBankAccountRepository;

    async function createHandler(validateBalance = true) {
        txRepo = new InMemoryTransactionRepository();
        accountRepo = new InMemoryBankAccountRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTransactionHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                { provide: BANK_ACCOUNT_REPOSITORY, useValue: accountRepo },
                { provide: CacheResultService, useValue: mockCacheResult() },
                { provide: ConfigService, useValue: mockConfigService(validateBalance) },
            ],
        }).compile();

        handler = module.get(CreateTransactionHandler);
    }

    afterEach(() => {
        txRepo?.reset();
        accountRepo?.reset();
    });

    describe('validation', () => {
        it('should throw when account does not exist', async () => {
            await createHandler();
            await expect(
                handler.execute(makeCmd({ account_id: 'nonexistent' })),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw on insufficient balance for debit', async () => {
            await createHandler(true);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(1000)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            await expect(
                handler.execute(makeCmd({ amount: 5000 })),
            ).rejects.toThrow(ConflictException);
        });

        it('should allow debit with sufficient balance', async () => {
            await createHandler(true);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 5000 }));
            expect(result.data.state).toBe('pending');
            expect(result.metadata.statusCode).toBe(201);
        });

        it('should ignore balance check when validateBalance is off', async () => {
            await createHandler(false);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(100)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 5000 }));
            expect(result.data.state).toBe('pending');
        });

        it('should skip balance check for non-financial operations', async () => {
            await createHandler(true);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(100)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({
                operation: 'balance_inquiry',
                type: undefined,
                amount: undefined,
            }));
            expect(result.data.state).toBe('pending');
        });

        it('should skip balance check for credit operations', async () => {
            await createHandler(true);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(100)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({
                type: 'credit',
                amount: 5000,
            }));
            expect(result.data.state).toBe('pending');
        });
    });

    describe('transaction creation', () => {
        it('should create a transaction with pending state', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({
                amount: 3000,
                description: 'Test transaction',
                correlation_id: 'corr-1',
                source_bank: 'bank_b',
            }));

            expect(result.data.amount).toBe(3000);
            expect(result.data.description).toBe('Test transaction');
            expect(result.data.correlationId).toBe('corr-1');
            expect(result.data.sourceBank).toBe('bank_b');
            expect(result.data.state).toBe('pending');
            expect(result.metadata.message).toBe('Transaction created successfully');
        });

        it('should persist the transaction', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 1000 }));
            const saved = await txRepo.findById(result.data.id);
            expect(saved).not.toBeNull();
            expect(saved!.amount).toBe(1000);
        });

        it('should default source_bank to bank_a', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-1').setReference('ACC-001')
                    .setType(ACCOUNT_TYPE.CHECKING)
                    .setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCmd({ source_bank: undefined }));
            expect(result.data.sourceBank).toBe('bank_a');
        });
    });
});
