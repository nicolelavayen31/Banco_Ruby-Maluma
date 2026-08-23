import { Agreement } from '@features/agreements/domain/agreement';
import { ApiProperty } from '@nestjs/swagger';
import type { IApiResponse } from '@shared/core/response/api-response';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';

export class GetAgreementByIdResponse implements IApiResponse<Agreement> {
    @ApiProperty({ type: () => Agreement })
    public readonly data: Agreement;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Agreement, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
