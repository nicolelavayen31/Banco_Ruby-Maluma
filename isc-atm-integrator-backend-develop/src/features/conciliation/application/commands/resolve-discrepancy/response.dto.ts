import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';

export class ResolveDiscrepancyResponse implements IApiResponse<null> {
    @ApiProperty({ nullable: true })
    public readonly data: null = null;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(metadata: IApiResponseMetadata) {
        this.metadata = metadata;
    }
}
