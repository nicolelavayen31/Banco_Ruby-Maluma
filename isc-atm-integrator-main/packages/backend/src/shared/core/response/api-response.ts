import { ApiProperty } from '@nestjs/swagger';
import { ResponseBuilder } from './api-response-builder';
import type { IApiResponseMetadata } from './api-response-metadata';
import { ResponseMetadata } from './api-response-metadata';

export interface IApiResponse<T> {
    readonly data: T;
    readonly metadata: IApiResponseMetadata;
}

export class Response<T> implements IApiResponse<T> {
    @ApiProperty({ description: 'Response payload' })
    public readonly data: T;

    @ApiProperty({
        type: () => ResponseMetadata,
        description: 'Response metadata',
    })
    public readonly metadata: IApiResponseMetadata;

    public constructor(data: T, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }

    public static builder<T>(): ResponseBuilder<T> {
        return new ResponseBuilder<T>();
    }
}
