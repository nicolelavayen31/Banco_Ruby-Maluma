import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUnreadCountQuery } from './query';
import { GetUnreadCountResponse } from './response.dto';
import { NOTIFICATION_REPOSITORY } from '@features/notifications/domain/notification.repository';
import type { INotificationRepository } from '@features/notifications/domain/notification.repository';

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    public async execute(
        query: GetUnreadCountQuery,
    ): Promise<GetUnreadCountResponse> {
        const count = await this.repository.countUnread(query.recipientId);
        return new GetUnreadCountResponse(count);
    }
}
