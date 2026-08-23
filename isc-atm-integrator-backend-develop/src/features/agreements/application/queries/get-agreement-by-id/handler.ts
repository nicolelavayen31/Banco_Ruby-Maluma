import { NotFoundException, Inject, HttpStatus } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import { GetAgreementByIdQuery } from './query';
import { GetAgreementByIdResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { Agreement } from '@features/agreements/domain/agreement';

@QueryHandler(GetAgreementByIdQuery)
export class GetAgreementByIdHandler
    extends ResilienceCommand
    implements IQueryHandler<GetAgreementByIdQuery, GetAgreementByIdResponse>
{
    public constructor(
        @Inject(AGREEMENT_REPOSITORY)
        private readonly repository: IAgreementRepository,
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
        query: GetAgreementByIdQuery,
    ): Promise<GetAgreementByIdResponse> {
        const agreement = await this.repository.findById(query.getId());
        if (!agreement) {
            throw new NotFoundException(
                `Agreement with ID ${query.getId()} not found`,
            );
        }

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('OK')
            .build();

        return new GetAgreementByIdResponse(
            agreement as unknown as Agreement,
            metadata,
        );
    }
}
