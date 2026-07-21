import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';
import { NotificationEntity } from '@features/notifications/infrastructure/persistence/typeorm/notification.entity';

export class GetNotificationsResponse
    implements IApiResponse<NotificationEntity[]>
{
    @ApiProperty({ type: () => [NotificationEntity] })
    public readonly data: NotificationEntity[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(
        data: NotificationEntity[],
        metadata: IApiResponseMetadata,
    ) {
        this.data = data;
        this.metadata = metadata;
    }
}
