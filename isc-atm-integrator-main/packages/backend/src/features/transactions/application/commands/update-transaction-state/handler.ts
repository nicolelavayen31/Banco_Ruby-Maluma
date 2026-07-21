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
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';

@CommandHandler(UpdateTransactionStateCommand)
export class UpdateTransactionStateHandler
    extends ResilienceCommand
    implements ICommandHandler<UpdateTransactionStateCommand>
{
    public constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly repository: ITransactionRepository,
        private readonly cacheResult: CacheResultService,
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

        entity.state = command.state;
        entity.updatedAt = new Date();
        await this.repository.save(entity as unknown as Transaction);

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
