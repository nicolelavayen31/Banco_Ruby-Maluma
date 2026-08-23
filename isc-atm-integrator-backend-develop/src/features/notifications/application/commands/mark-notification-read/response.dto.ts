import { ApiProperty } from '@nestjs/swagger';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';

export class MarkNotificationReadResponse {
    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(metadata: IApiResponseMetadata) {
        this.metadata = metadata;
    }
}
