import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiSecurity, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiExtraModels } from '@nestjs/swagger';
import { RunConciliationCommand } from '../application/commands/run-conciliation/command';
import { ResolveDiscrepancyCommand } from '../application/commands/resolve-discrepancy/command';
import { GetConciliationsQuery } from '../application/queries/get-conciliations/query';
import { GetConciliationReportQuery } from '../application/queries/get-conciliation-report/query';
import { ConciliationResponse, GetConciliationsResponse } from '../application/queries/get-conciliations/response.dto';
import { GetConciliationReportResponse } from '../application/queries/get-conciliation-report/response.dto';
import { ConciliationEntity } from '../infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../infrastructure/persistence/typeorm/conciliation-match.entity';

@ApiTags('Conciliation')
@ApiBearerAuth()
@ApiSecurity('api-key')
@ApiExtraModels(ConciliationEntity, ConciliationMatchEntity)
@Controller({ path: 'conciliation', version: '1' })
export class ConciliationController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post('run')
    @ApiCreatedResponse({ type: ConciliationResponse })
    public async run(): Promise<ConciliationResponse> {
        return this.commandBus.execute(new RunConciliationCommand());
    }

    @Get()
    @ApiOkResponse({ type: GetConciliationsResponse })
    public async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<GetConciliationsResponse> {
        return this.queryBus.execute(new GetConciliationsQuery(page, limit));
    }

    @Get(':id')
    @ApiOkResponse({ type: GetConciliationReportResponse })
    public async findOne(@Param('id') id: string): Promise<GetConciliationReportResponse> {
        return this.queryBus.execute(new GetConciliationReportQuery(id));
    }

    @Patch(':id/resolve/:matchId')
    @ApiOkResponse()
    public async resolve(
        @Param('matchId') matchId: string,
        @Body('notes') notes?: string,
    ): Promise<void> {
        await this.commandBus.execute(new ResolveDiscrepancyCommand(matchId, notes));
    }
}
