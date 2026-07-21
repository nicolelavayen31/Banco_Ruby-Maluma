import {
    ConflictException,
    HttpStatus,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    BulkheadStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { CreateTransactionCommand } from './command';
import { CreateTransactionResponse } from './response.dto';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import {
    Transaction,
    TRANSACTION_STATE,
    TRANSACTION_TYPE,
    NON_FINANCIAL_OPERATIONS,
} from '@features/transactions/domain/transaction';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { TransactionCreatedEvent } from '@features/transactions/application/events/transaction-created.event';
import type { AppConfigService } from '@shared/core/types';

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler
    extends ResilienceCommand
    implements ICommandHandler<CreateTransactionCommand>
{
    public constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly repository: ITransactionRepository,
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly accountRepository: IBankAccountRepository,
        private readonly cacheResult: CacheResultService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new BulkheadStrategy({ maxConcurrent: 5, maxQueue: 10 }),
            new TimeoutStrategy(5000),
        ]);
    }

    public async run(
        command: CreateTransactionCommand,
    ): Promise<CreateTransactionResponse> {
        const account = await this.accountRepository.findById(
            command.account_id,
        );
        if (!account) {
            throw new NotFoundException(
                `Account with ID ${command.account_id} not found`,
            );
        }

        const isNonFinancial = NON_FINANCIAL_OPERATIONS.includes(
            command.operation,
        );

        const validateBalance = (
            this.configService as unknown as AppConfigService
        ).get('features.validateBalance', { infer: true });

        if (
            validateBalance &&
            !isNonFinancial &&
            command.type === TRANSACTION_TYPE.DEBIT &&
            command.amount
        ) {
            if (account.balance < command.amount) {
                throw new ConflictException(
                    `Insufficient balance: required ${command.amount}, available ${account.balance}`,
                );
            }
        }

        void this.cacheResult.clear();

        const result = Transaction.Builder.setId(crypto.randomUUID())
            .setAmount(command.amount)
            .setOperation(command.operation)
            .setType(command.type)
            .setState(TRANSACTION_STATE.PENDING)
            .setDescription(command.description)
            .setBankAccountId(command.account_id)
            .setCorrelationId(command.correlation_id)
            .setSourceBank(command.source_bank ?? 'bank_a')
            .setCreatedAt(new Date())
            .setUpdatedAt(new Date())
            .build();

        await this.repository.save(result);

        this.eventEmitter.emit(
            TransactionCreatedEvent.eventName,
            new TransactionCreatedEvent(
                result.id,
                result.bankAccountId,
                result.amount ?? 0,
                result.type ?? 'debit',
                result.description ?? '',
                result.operation,
            ),
        );

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage('Transaction created successfully')
            .build();

        return new CreateTransactionResponse(result, metadata);
    }
}
