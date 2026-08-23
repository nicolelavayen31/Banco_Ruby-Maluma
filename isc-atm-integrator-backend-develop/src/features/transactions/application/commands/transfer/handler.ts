import {
    ConflictException,
    HttpStatus,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { TransferCommand } from './command';
import { TransferResponse } from './response.dto';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import {
    Transaction,
    TRANSACTION_OPERATION,
    TRANSACTION_TYPE,
    TRANSACTION_STATE,
} from '@features/transactions/domain/transaction';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { OutboxService } from '@shared/outbox';

@CommandHandler(TransferCommand)
export class TransferHandler
    extends ResilienceCommand
    implements ICommandHandler<TransferCommand>
{
    public constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly repository: ITransactionRepository,
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly accountRepository: IBankAccountRepository,
        private readonly cacheResult: CacheResultService,
        private readonly configService: ConfigService,
        private readonly outboxService: OutboxService,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new TimeoutStrategy(10_000),
        ]);
    }

    public async run(command: TransferCommand): Promise<TransferResponse> {
        const fromAccount = await this.accountRepository.findById(
            command.from_account_id,
        );
        if (!fromAccount) {
            throw new NotFoundException(
                `Source account with ID ${command.from_account_id} not found`,
            );
        }

        const toAccount = await this.accountRepository.findById(
            command.to_account_id,
        );
        if (!toAccount) {
            throw new NotFoundException(
                `Destination account with ID ${command.to_account_id} not found`,
            );
        }

        const validateBalance = this.configService.get<boolean>(
            'features.validateBalance',
            { infer: true },
        ) as boolean;

        if (validateBalance && fromAccount.balance < command.amount) {
            throw new ConflictException(
                `Insufficient balance in source account: required ${command.amount}, available ${fromAccount.balance}`,
            );
        }

        void this.cacheResult.clear();

        const correlationId = command.correlation_id ?? crypto.randomUUID();
        const startingBank = command.source_bank ?? 'bank_a';
        const debitSourceBank = startingBank === 'bank_b' ? 'bank_b' : 'bank_a';
        const creditSourceBank =
            debitSourceBank === 'bank_a' ? 'bank_b' : 'bank_a';
        const now = new Date();

        const debit = Transaction.Builder.setId(crypto.randomUUID())
            .setAmount(command.amount)
            .setOperation(TRANSACTION_OPERATION.TRANSFER)
            .setType(TRANSACTION_TYPE.DEBIT)
            .setState(TRANSACTION_STATE.PENDING)
            .setDescription(command.description)
            .setBankAccountId(command.from_account_id)
            .setCorrelationId(correlationId)
            .setSourceBank(debitSourceBank)
            .setCreatedAt(now)
            .setUpdatedAt(now)
            .build();

        const credit = Transaction.Builder.setId(crypto.randomUUID())
            .setAmount(command.amount)
            .setOperation(TRANSACTION_OPERATION.TRANSFER)
            .setType(TRANSACTION_TYPE.CREDIT)
            .setState(TRANSACTION_STATE.PENDING)
            .setDescription(command.description)
            .setBankAccountId(command.to_account_id)
            .setCorrelationId(correlationId)
            .setSourceBank(creditSourceBank)
            .setCreatedAt(now)
            .setUpdatedAt(now)
            .build();

        await this.repository.save(debit);
        await this.repository.save(credit);

        await this.outboxService.save({
            aggregateId: debit.id,
            eventType: 'transaction.completed',
            payload: {
                transaction: {
                    id: debit.id,
                    amount: debit.amount,
                    operation: debit.operation,
                    type: debit.type,
                    state: debit.state,
                    description: debit.description,
                    bankAccountId: debit.bankAccountId,
                    correlationId: debit.correlationId,
                    sourceBank: debit.sourceBank,
                    fromInnerAccount: command.from_inner_account,
                    toInnerAccount: command.to_inner_account,
                    createdAt: debit.createdAt.toISOString(),
                    updatedAt: debit.updatedAt.toISOString(),
                },
                agreementId: fromAccount.agreementId,
            },
        });

        await this.outboxService.save({
            aggregateId: credit.id,
            eventType: 'transaction.completed',
            payload: {
                transaction: {
                    id: credit.id,
                    amount: credit.amount,
                    operation: credit.operation,
                    type: credit.type,
                    state: credit.state,
                    description: credit.description,
                    bankAccountId: credit.bankAccountId,
                    correlationId: credit.correlationId,
                    sourceBank: credit.sourceBank,
                    fromInnerAccount: command.from_inner_account,
                    toInnerAccount: command.to_inner_account,
                    createdAt: credit.createdAt.toISOString(),
                    updatedAt: credit.updatedAt.toISOString(),
                },
                agreementId: toAccount.agreementId,
            },
        });

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage('Transfer created successfully')
            .build();

        return new TransferResponse([debit, credit], metadata);
    }
}
