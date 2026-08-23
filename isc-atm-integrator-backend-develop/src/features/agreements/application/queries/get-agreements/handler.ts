import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    RetryStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import { GetAgreementsQuery } from './query';
import { GetAgreementsResponse } from './response.dto';
import { ResponseMetadataPaginationBuilder } from '@core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { Agreement } from '@features/agreements/domain/agreement';

@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler
    extends ResilienceCommand
    implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponse>
{
    public constructor(
        @Inject(AGREEMENT_REPOSITORY)
        private readonly repository: IAgreementRepository,
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
        query: GetAgreementsQuery,
    ): Promise<GetAgreementsResponse> {
        const cacheKey = `agreements:p${query.page}:l${query.limit}:s${query.state ?? 'all'}`;

        const cacheResult =
            await this.cacheResult.get<GetAgreementsResponse>(cacheKey);
        if (cacheResult.isSuccess()) {
            return cacheResult.getValue();
        }

        const result = await this.repository.findAll(
            query.page,
            query.limit,
            query.state,
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

        const response = new GetAgreementsResponse(
            result.items as unknown as Agreement[],
            metadata,
        );

        void this.cacheResult.set(cacheKey, response);

        return response;
    }
}
