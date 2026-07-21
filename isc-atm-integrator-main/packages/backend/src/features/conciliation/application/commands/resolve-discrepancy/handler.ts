import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CONCILIATION_REPOSITORY } from '../../../domain/conciliation.repository';
import type { IConciliationRepository } from '../../../domain/conciliation.repository';
import { ResolveDiscrepancyCommand } from './command';
import { ResolveDiscrepancyResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';

@CommandHandler(ResolveDiscrepancyCommand)
export class ResolveDiscrepancyHandler implements ICommandHandler<ResolveDiscrepancyCommand> {
    public constructor(
        @Inject(CONCILIATION_REPOSITORY)
        private readonly repository: IConciliationRepository,
    ) {}

    public async execute(command: ResolveDiscrepancyCommand): Promise<ResolveDiscrepancyResponse> {
        await this.repository.updateMatchStatus(command.matchId, 'resolved', command.notes);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('Discrepancy resolved')
            .build();

        return new ResolveDiscrepancyResponse(metadata);
    }
}
