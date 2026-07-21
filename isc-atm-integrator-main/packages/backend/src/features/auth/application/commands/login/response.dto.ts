import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import type { IApiResponseMetadata } from '@shared/core/response/api-response-metadata';
import { ResponseMetadata } from '@shared/core/response/api-response-metadata';

export class LoginData {
    @ApiProperty()
    public readonly accessToken: string;

    @ApiProperty()
    public readonly refreshToken: string;

    constructor(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}

export class LoginResponse implements IApiResponse<LoginData> {
    @ApiProperty({ type: () => LoginData })
    public readonly data: LoginData;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: LoginData, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
