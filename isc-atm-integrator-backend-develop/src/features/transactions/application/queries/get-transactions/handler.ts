import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    RetryStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import { GetTransactionsQuery } from './query';
import { GetTransactionsResponse } from './response.dto';
import { ResponseMetadataPaginationBuilder } from '@core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { Transaction } from '@features/transactions/domain/transaction';

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler
    extends ResilienceCommand
    implements IQueryHandler<GetTransactionsQuery, GetTransactionsResponse>
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
            new TimeoutStrategy(20_000),
            new RetryStrategy({ maxRetries: 3 }),
        ]);
    }

    public async run(
        query: GetTransactionsQuery,
    ): Promise<GetTransactionsResponse> {
        const cacheKey = `transactions:p${query.page}:l${query.limit}:a${query.accountId ?? 'all'}:c${query.correlationId ?? 'all'}:o${query.operation ?? 'all'}:s${query.state ?? 'all'}:b${query.sourceBank ?? 'all'}`;

        const cacheResult =
            await this.cacheResult.get<GetTransactionsResponse>(cacheKey);
        if (cacheResult.isSuccess()) {
            return cacheResult.getValue();
        }

        const result = await this.repository.findAll(
            query.page,
            query.limit,
            query.accountId,
            query.correlationId,
            query.operation,
            query.state,
            query.sourceBank,
        );

        const pagination = new ResponseMetadataPaginationBuilder()
            .setPage(result.page)
            .setLimit(result.limit)
            .setTotalItems(result.total)
            .build();

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('OK')
            .setPagination(pagination)
            .build();

        const response = new GetTransactionsResponse(
            result.items as unknown as Transaction[],
            metadata,
        );

        void this.cacheResult.set(cacheKey, response);

        return response;
    }
}
