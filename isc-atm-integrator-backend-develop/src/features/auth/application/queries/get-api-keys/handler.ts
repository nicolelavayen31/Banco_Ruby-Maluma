import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    RetryStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { API_KEY_REPOSITORY } from '@features/auth/domain/api-key.repository';
import type { IApiKeyRepository } from '@features/auth/domain/api-key.repository';
import { GetApiKeysQuery } from './query';
import { GetApiKeysResponse } from './response.dto';
import { ResponseMetadataPaginationBuilder } from '@core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import { ApiKey } from '@features/auth/domain/api-key';

@QueryHandler(GetApiKeysQuery)
export class GetApiKeysHandler
    extends ResilienceCommand
    implements IQueryHandler<GetApiKeysQuery, GetApiKeysResponse>
{
    public constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        private readonly cacheResult: CacheResultService,
    ) {
        super([
            new TimeoutStrategy(20_000),
            new RetryStrategy({ maxRetries: 3 }),
        ]);
    }

    public async run(query: GetApiKeysQuery): Promise<GetApiKeysResponse> {
        const cacheKey = `api_keys:a${query.agreementId}:p${query.page}:l${query.limit}`;

        const cached = await this.cacheResult.get<GetApiKeysResponse>(cacheKey);
        if (cached.isSuccess()) {
            return cached.getValue();
        }

        const result = await this.apiKeyRepository.findAllByAgreement(
            query.agreementId,
            query.page,
            query.limit,
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

        const response = new GetApiKeysResponse(
            result.items.map((item) => {
                return {
                    ...item,
                    keyHash: undefined,
                } as unknown as ApiKey;
            }),
            metadata,
        );

        void this.cacheResult.set(cacheKey, response);

        return response;
    }
}
