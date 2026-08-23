import {
    ConflictException,
    HttpStatus,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { UpdateTransactionStateCommand } from './command';
import { UpdateTransactionStateResponse } from './response.dto';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import {
    Transaction,
    ALLOWED_STATE_TRANSITIONS,
} from '@features/transactions/domain/transaction';
import { calculateBalanceEffect } from '@features/transactions/domain/balance-effect';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { BankAccount } from '@features/accounts/domain/account';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { OutboxService } from '@shared/outbox';

@CommandHandler(UpdateTransactionStateCommand)
export class UpdateTransactionStateHandler
    extends ResilienceCommand
    implements ICommandHandler<UpdateTransactionStateCommand>
{
    public constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly repository: ITransactionRepository,
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly accountRepository: IBankAccountRepository,
        private readonly cacheResult: CacheResultService,
        private readonly outboxService: OutboxService,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new TimeoutStrategy(5000),
        ]);
    }

    public async run(
        command: UpdateTransactionStateCommand,
    ): Promise<UpdateTransactionStateResponse> {
        const entity = await this.repository.findById(command.id);
        if (!entity) {
            throw new NotFoundException(
                `Transaction with ID ${command.id} not found`,
            );
        }

        const allowedTransitions =
            ALLOWED_STATE_TRANSITIONS[entity.state] ?? [];
        if (!allowedTransitions.includes(command.state)) {
            throw new ConflictException(
                `Invalid state transition from ${entity.state} to ${command.state}`,
            );
        }

        void this.cacheResult.clear();

        const previousState = entity.state;
        const account = await this.accountRepository.findById(
            entity.bankAccountId,
        );
        if (!account) {
            throw new NotFoundException(
                `Bank account with ID ${entity.bankAccountId} not found`,
            );
        }

        const balanceEffect = calculateBalanceEffect(
            previousState,
            command.state,
            entity.type,
            Number(entity.amount ?? 0),
        );

        if (balanceEffect !== 0) {
            account.balance = Number(account.balance) + balanceEffect;
            account.updatedAt = new Date();
            await this.accountRepository.save(
                account as unknown as BankAccount,
            );
        }

        entity.state = command.state;
        entity.updatedAt = new Date();
        await this.repository.save(entity as unknown as Transaction);

        const agreementId = account?.agreementId;

        await this.outboxService.save({
            aggregateId: entity.id,
            eventType: 'transaction.state_changed',
            payload: {
                transaction: {
                    id: entity.id,
                    amount: entity.amount,
                    operation: entity.operation,
                    type: entity.type,
                    state: entity.state,
                    previousState,
                    description: entity.description,
                    bankAccountId: entity.bankAccountId,
                    correlationId: entity.correlationId,
                    sourceBank: entity.sourceBank,
                    createdAt: entity.createdAt.toISOString(),
                    updatedAt: entity.updatedAt.toISOString(),
                },
                agreementId,
            },
        });

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('Transaction state updated successfully')
            .build();

        return new UpdateTransactionStateResponse(
            entity as unknown as Transaction,
            metadata,
        );
    }
}
