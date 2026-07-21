import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransferHandler } from '../handler';
import { TransferCommand } from '../command';
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

function makeCmd(overrides: Record<string, unknown> = {}): TransferCommand {
    return Object.assign(new TransferCommand(), {
        from_account_id: 'acc-from',
        to_account_id: 'acc-to',
        amount: 5000,
        description: 'Transfer test',
        ...overrides,
    });
}

describe('TransferHandler', () => {
    let handler: TransferHandler;
    let txRepo: InMemoryTransactionRepository;
    let accountRepo: InMemoryBankAccountRepository;

    async function createHandler(validateBalance = true) {
        txRepo = new InMemoryTransactionRepository();
        accountRepo = new InMemoryBankAccountRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransferHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                { provide: BANK_ACCOUNT_REPOSITORY, useValue: accountRepo },
                { provide: CacheResultService, useValue: mockCacheResult() },
                { provide: ConfigService, useValue: mockConfigService(validateBalance) },
            ],
        }).compile();

        handler = module.get(TransferHandler);
    }

    afterEach(() => {
        txRepo?.reset();
        accountRepo?.reset();
    });

    describe('transfer execution', () => {
        it('should create debit and credit transactions', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder.setId('acc-from').setReference('FROM')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
                BankAccount.Builder.setId('acc-to').setReference('TO')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 3000 }));

            expect(result.data).toHaveLength(2);
            const debit = result.data[0];
            const credit = result.data[1];

            expect(debit.type).toBe('debit');
            expect(debit.bankAccountId).toBe('acc-from');
            expect(credit.type).toBe('credit');
            expect(credit.bankAccountId).toBe('acc-to');
            expect(debit.amount).toBe(3000);
            expect(credit.amount).toBe(3000);
            expect(debit.correlationId).toBe(credit.correlationId);
        });

        it('should persist both transactions', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder.setId('acc-from').setReference('FROM')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
                BankAccount.Builder.setId('acc-to').setReference('TO')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 2500 }));

            const savedDebit = await txRepo.findById(result.data[0].id);
            const savedCredit = await txRepo.findById(result.data[1].id);
            expect(savedDebit).not.toBeNull();
            expect(savedCredit).not.toBeNull();
        });

        it('should work without balance validation', async () => {
            await createHandler(false);
            accountRepo.seed([
                BankAccount.Builder.setId('acc-from').setReference('FROM')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(100)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
                BankAccount.Builder.setId('acc-to').setReference('TO')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(0)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            const result = await handler.execute(makeCmd({ amount: 5000 }));
            expect(result.data).toHaveLength(2);
            expect(result.metadata.statusCode).toBe(201);
        });
    });

    describe('validation', () => {
        it('should throw when source account not found', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-to').setReference('TO')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            await expect(
                handler.execute(makeCmd({ from_account_id: 'nonexistent' })),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw when destination account not found', async () => {
            await createHandler();
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-from').setReference('FROM')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            await expect(
                handler.execute(makeCmd({ to_account_id: 'nonexistent' })),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw on insufficient balance', async () => {
            await createHandler(true);
            accountRepo.seed([
                BankAccount.Builder
                    .setId('acc-from').setReference('FROM')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(100)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
                BankAccount.Builder
                    .setId('acc-to').setReference('TO')
                    .setType(ACCOUNT_TYPE.CHECKING).setBalance(10000)
                    .setState(ACCOUNT_STATE.ACTIVE).setAgreementId('agr-1')
                    .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
            ]);

            await expect(
                handler.execute(makeCmd({ amount: 5000 })),
            ).rejects.toThrow(ConflictException);
        });
    });
});
