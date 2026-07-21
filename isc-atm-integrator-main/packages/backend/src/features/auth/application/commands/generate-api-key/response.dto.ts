import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';

export class GenerateApiKeyData {
    @ApiProperty()
    public readonly apiKey: string;

    @ApiProperty()
    public readonly prefix: string;

    @ApiProperty()
    public readonly name: string;

    constructor(apiKey: string, prefix: string, name: string) {
        this.apiKey = apiKey;
        this.prefix = prefix;
        this.name = name;
    }
}

export class GenerateApiKeyResponse implements IApiResponse<GenerateApiKeyData> {
    @ApiProperty({ type: () => GenerateApiKeyData })
    public readonly data: GenerateApiKeyData;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: GenerateApiKeyData, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
