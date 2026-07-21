import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ApiKey } from '@features/auth/domain/api-key';

export class RevokeApiKeyResponse implements IApiResponse<ApiKey> {
    @ApiProperty({ type: () => ApiKey })
    public readonly data: ApiKey;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: ApiKey, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
