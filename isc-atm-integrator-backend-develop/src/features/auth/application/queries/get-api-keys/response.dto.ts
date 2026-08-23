import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@core/response/api-response';
import type { IApiResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { ApiKey } from '@features/auth/domain/api-key';

export class GetApiKeysResponse implements IApiResponse<ApiKey[]> {
    @ApiProperty({ type: () => ApiKey, isArray: true })
    public readonly data: ApiKey[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: ApiKey[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
