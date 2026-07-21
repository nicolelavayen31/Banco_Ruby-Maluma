import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MarkNotificationReadCommand } from './command';
import { MarkNotificationReadResponse } from './response.dto';
import { NOTIFICATION_REPOSITORY } from '@features/notifications/domain/notification.repository';
import type { INotificationRepository } from '@features/notifications/domain/notification.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler
    implements ICommandHandler<MarkNotificationReadCommand>
{
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    public async run(
        command: MarkNotificationReadCommand,
    ): Promise<MarkNotificationReadResponse> {
        const notification = await this.repository.findById(command.id);
        if (!notification) {
            throw new NotFoundException(
                `Notification with ID ${command.id} not found`,
            );
        }

        await this.repository.markAsRead(command.id);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('Notification marked as read')
            .build();

        return new MarkNotificationReadResponse(metadata);
    }

    public async execute(
        command: MarkNotificationReadCommand,
    ): Promise<MarkNotificationReadResponse> {
        return this.run(command);
    }
}
