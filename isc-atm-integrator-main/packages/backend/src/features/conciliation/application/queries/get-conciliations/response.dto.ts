import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ConciliationEntity } from '../../../infrastructure/persistence/typeorm/conciliation.entity';

export class ConciliationResponse implements IApiResponse<ConciliationEntity> {
    @ApiProperty({ type: () => ConciliationEntity })
    public readonly data: ConciliationEntity;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: ConciliationEntity, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}

export class GetConciliationsResponse implements IApiResponse<ConciliationEntity[]> {
    @ApiProperty({ type: () => ConciliationEntity, isArray: true })
    public readonly data: ConciliationEntity[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: ConciliationEntity[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
