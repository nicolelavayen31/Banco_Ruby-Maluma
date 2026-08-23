import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { Notification } from '../domain/notification';
import { NOTIFICATION_CHANNEL } from '../domain/notification-channel';
import { NOTIFICATION_REPOSITORY } from '../domain/notification.repository';
import type { INotificationRepository } from '../domain/notification.repository';
import { NotificationCreatedEvent } from './events/notification-created.event';

interface PublishParams {
    type: string;
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];
}

@Injectable()
export class NotificationPublisher {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async publish(params: PublishParams): Promise<Notification> {
        const notification = Notification.Builder.setId(randomUUID())
            .setType(params.type)
            .setChannel(params.channel ?? NOTIFICATION_CHANNEL.IN_APP)
            .setRecipientId(params.recipientId)
            .setTitle(params.title)
            .setBody(params.body)
            .setData(params.data ?? {})
            .setCreatedAt(new Date())
            .build();

        await this.repository.save(notification);

        this.eventEmitter.emit(
            NotificationCreatedEvent.eventName,
            new NotificationCreatedEvent(
                notification.id,
                notification.channel,
                notification.recipientId,
                notification.title,
                notification.body,
            ),
        );

        return notification;
    }
}
