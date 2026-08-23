import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@core/response/api-response';
import type { IApiResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { Agreement } from '@features/agreements/domain/agreement';

export class GetAgreementsResponse implements IApiResponse<Agreement[]> {
    @ApiProperty({ type: () => Agreement, isArray: true })
    public readonly data: Agreement[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Agreement[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
