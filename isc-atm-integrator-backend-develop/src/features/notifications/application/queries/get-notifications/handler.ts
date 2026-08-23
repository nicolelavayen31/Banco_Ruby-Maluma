import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetNotificationsQuery } from './query';
import { GetNotificationsResponse } from './response.dto';
import { NOTIFICATION_REPOSITORY } from '@features/notifications/domain/notification.repository';
import type { INotificationRepository } from '@features/notifications/domain/notification.repository';
import { ResponseMetadataPaginationBuilder } from '@shared/core/response/api-response-metadata-pagination-builder';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    public async execute(
        query: GetNotificationsQuery,
    ): Promise<GetNotificationsResponse> {
        const result = await this.repository.findByRecipient(
            'all',
            query.page,
            query.limit,
            query.unreadOnly,
        );

        const pagination = new ResponseMetadataPaginationBuilder()
            .setPage(result.page)
            .setLimit(result.limit)
            .setTotalItems(result.total)
            .build();

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(200)
            .setPagination(pagination)
            .build();

        return new GetNotificationsResponse(result.items, metadata);
    }
}
