import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ConciliationEntity } from '../../../infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../../../infrastructure/persistence/typeorm/conciliation-match.entity';

export class ConciliationReport {
    @ApiProperty({ type: () => ConciliationEntity })
    public readonly conciliation: ConciliationEntity;

    @ApiProperty({ type: () => ConciliationMatchEntity, isArray: true })
    public readonly matches: ConciliationMatchEntity[];

    constructor(conciliation: ConciliationEntity, matches: ConciliationMatchEntity[]) {
        this.conciliation = conciliation;
        this.matches = matches;
    }
}

export class GetConciliationReportResponse implements IApiResponse<ConciliationReport> {
    @ApiProperty({ type: () => ConciliationReport })
    public readonly data: ConciliationReport;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: ConciliationReport, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
