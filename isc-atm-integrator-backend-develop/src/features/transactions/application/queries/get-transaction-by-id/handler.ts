import { NotFoundException, Inject, HttpStatus } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import { GetTransactionByIdQuery } from './query';
import { GetTransactionByIdResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { Transaction } from '@features/transactions/domain/transaction';

@QueryHandler(GetTransactionByIdQuery)
export class GetTransactionByIdHandler
    extends ResilienceCommand
    implements
        IQueryHandler<GetTransactionByIdQuery, GetTransactionByIdResponse>
{
    public constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly repository: ITransactionRepository,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new TimeoutStrategy(3000),
        ]);
    }

    public async run(
        query: GetTransactionByIdQuery,
    ): Promise<GetTransactionByIdResponse> {
        const transaction = await this.repository.findById(query.getId());
        if (!transaction) {
            throw new NotFoundException(
                `Transaction with ID ${query.getId()} not found`,
            );
        }

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('OK')
            .build();

        return new GetTransactionByIdResponse(
            transaction as unknown as Transaction,
            metadata,
        );
    }
}
