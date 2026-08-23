import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards,
    UseInterceptors,
    Version,
} from '@nestjs/common';
import {
    CombinedAuthGuard,
    PermissionsGuard,
} from '@features/auth/presentation/auth-guards.index';
import { RequiresPermissions } from '@features/auth/presentation/permissions.decorator';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    ResilienceInterceptor,
    ThrottleStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { GetNotificationsQuery } from '../application/queries/get-notifications/query';
import { GetNotificationsResponse } from '../application/queries/get-notifications/response.dto';
import { GetUnreadCountQuery } from '../application/queries/get-unread-count/query';
import { GetUnreadCountResponse } from '../application/queries/get-unread-count/response.dto';
import { MarkNotificationReadCommand } from '../application/commands/mark-notification-read/command';
import { MarkNotificationReadResponse } from '../application/commands/mark-notification-read/response.dto';
import { ApiResponseError } from '@shared/core/response/api-response-error';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadataPagination } from '@core/response/api-response-metadata-pagination';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiSecurity('api-key')
@ApiExtraModels(
    ResponseMetadata,
    ResponseMetadataPagination,
    ApiResponseError,
    GetNotificationsResponse,
)
@Controller('notifications')
@UseGuards(CombinedAuthGuard, PermissionsGuard)
@UseInterceptors(
    ResilienceInterceptor(
        new ThrottleStrategy({ ttl: 60_000, limit: 60 }),
        new TimeoutStrategy(30_000),
    ),
)
export class NotificationsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get()
    @Version('1')
    @ApiOkResponse({
        description: 'Notifications found',
        type: GetNotificationsResponse,
    })
    @RequiresPermissions('notifications:read')
    public async list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('unread_only') unreadOnly?: string,
    ): Promise<GetNotificationsResponse> {
        return this.queryBus.execute<GetNotificationsResponse>(
            new GetNotificationsQuery(page, limit, unreadOnly === 'true'),
        );
    }

    @Get('unread-count')
    @Version('1')
    @ApiOkResponse({
        description: 'Unread notifications count',
        type: GetUnreadCountResponse,
    })
    @RequiresPermissions('notifications:read')
    public async unreadCount(): Promise<GetUnreadCountResponse> {
        return this.queryBus.execute<GetUnreadCountResponse>(
            new GetUnreadCountQuery(),
        );
    }

    @Patch(':id/read')
    @Version('1')
    @ApiOkResponse({
        description: 'Notification marked as read',
        type: MarkNotificationReadResponse,
    })
    @RequiresPermissions('notifications:write')
    public async markAsRead(
        @Param('id') id: string,
    ): Promise<MarkNotificationReadResponse> {
        return this.commandBus.execute<MarkNotificationReadResponse>(
            new MarkNotificationReadCommand(id),
        );
    }
}
