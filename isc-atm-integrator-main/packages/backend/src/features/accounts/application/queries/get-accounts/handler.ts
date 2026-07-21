import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    RetryStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { GetAccountsQuery } from './query';
import { GetAccountsResponse } from './response.dto';
import { ResponseMetadataPaginationBuilder } from '@core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { BankAccount } from '@features/accounts/domain/account';

@QueryHandler(GetAccountsQuery)
export class GetAccountsHandler
    extends ResilienceCommand
    implements IQueryHandler<GetAccountsQuery, GetAccountsResponse>
{
    public constructor(
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly repository: IBankAccountRepository,
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

    public async run(query: GetAccountsQuery): Promise<GetAccountsResponse> {
        const cacheKey = `accounts:p${query.page}:l${query.limit}:a${query.agreementId ?? 'all'}:t${query.type ?? 'all'}:s${query.state ?? 'all'}`;

        const cacheResult =
            await this.cacheResult.get<GetAccountsResponse>(cacheKey);
        if (cacheResult.isSuccess()) {
            return cacheResult.getValue();
        }

        const result = await this.repository.findAll(
            query.page,
            query.limit,
            query.agreementId,
            query.type,
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

        const response = new GetAccountsResponse(
            result.items as unknown as BankAccount[],
            metadata,
        );

        void this.cacheResult.set(cacheKey, response);

        return response;
    }
}
