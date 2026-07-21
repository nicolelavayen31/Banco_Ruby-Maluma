import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    BulkheadStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { CreateAgreementCommand } from './command';
import { CreateAgreementResponse } from './response.dto';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import {
    Agreement,
    AGREEMENT_STATE,
} from '@features/agreements/domain/agreement';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';

@CommandHandler(CreateAgreementCommand)
export class CreateAgreementHandler
    extends ResilienceCommand
    implements ICommandHandler<CreateAgreementCommand>
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
            new BulkheadStrategy({ maxConcurrent: 5, maxQueue: 10 }),
            new TimeoutStrategy(5000),
        ]);
    }

    public async run(
        command: CreateAgreementCommand,
    ): Promise<CreateAgreementResponse> {
        void this.cacheResult.clear();

        const result = Agreement.Builder.setId(crypto.randomUUID())
            .setName(command.name)
            .setReference(command.reference)
            .setState(AGREEMENT_STATE.ACTIVE)
            .setCreatedAt(new Date())
            .setUpdatedAt(new Date())
            .build();

        await this.repository.save(result);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage('Agreement created successfully')
            .build();

        return new CreateAgreementResponse(result, metadata);
    }
}
