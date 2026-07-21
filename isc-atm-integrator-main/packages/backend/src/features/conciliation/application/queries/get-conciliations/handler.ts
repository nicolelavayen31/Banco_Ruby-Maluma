import { HttpStatus, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CONCILIATION_REPOSITORY } from '../../../domain/conciliation.repository';
import type { IConciliationRepository } from '../../../domain/conciliation.repository';
import { GetConciliationsQuery } from './query';
import { GetConciliationsResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { ResponseMetadataPaginationBuilder } from '@shared/core/response/api-response-metadata-pagination-builder';

@QueryHandler(GetConciliationsQuery)
export class GetConciliationsHandler implements IQueryHandler<GetConciliationsQuery> {
    public constructor(
        @Inject(CONCILIATION_REPOSITORY)
        private readonly repository: IConciliationRepository,
    ) {}

    public async execute(query: GetConciliationsQuery): Promise<GetConciliationsResponse> {
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

        return new GetConciliationsResponse(result.items, metadata);
    }
}
