import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CONCILIATION_REPOSITORY } from '../../../domain/conciliation.repository';
import type { IConciliationRepository } from '../../../domain/conciliation.repository';
import { GetConciliationReportQuery } from './query';
import { GetConciliationReportResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';

@QueryHandler(GetConciliationReportQuery)
export class GetConciliationReportHandler implements IQueryHandler<GetConciliationReportQuery> {
    public constructor(
        @Inject(CONCILIATION_REPOSITORY)
        private readonly repository: IConciliationRepository,
    ) {}

    public async execute(query: GetConciliationReportQuery): Promise<GetConciliationReportResponse> {
        const conciliation = await this.repository.findById(query.conciliationId);
        if (!conciliation) {
            throw new NotFoundException(`Conciliation ${query.conciliationId} not found`);
        }

        const matches = await this.repository.findMatchesByConciliationId(query.conciliationId);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('OK')
            .build();

        return new GetConciliationReportResponse({ conciliation, matches }, metadata);
    }
}
