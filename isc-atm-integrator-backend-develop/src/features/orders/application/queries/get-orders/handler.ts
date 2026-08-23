import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    RetryStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { ORDER_REPOSITORY } from '@features/orders/domain/order.repository';
import type { IOrderRepository } from '@features/orders/domain/order.repository';
import { GetOrdersQuery } from './query';
import { GetOrdersResponse } from './response.dto';
import { ResponseMetadataPaginationBuilder } from '@core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler
    extends ResilienceCommand
    implements IQueryHandler<GetOrdersQuery, GetOrdersResponse>
{
    public constructor(
        @Inject(ORDER_REPOSITORY) private readonly repository: IOrderRepository,
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

    public async run(query: GetOrdersQuery): Promise<GetOrdersResponse> {
        const cacheKey = `orders:p${query.page}:l${query.limit}`;

        const cacheResult =
            await this.cacheResult.get<GetOrdersResponse>(cacheKey);
        if (cacheResult.isSuccess()) {
            return cacheResult.getValue();
        }

        const result = await this.repository.findAll(query.page, query.limit);

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

        const response = new GetOrdersResponse([], metadata);

        void this.cacheResult.set(cacheKey, response);

        return response;
    }
}
