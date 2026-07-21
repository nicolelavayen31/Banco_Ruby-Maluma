import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from '@features/notifications/application/events/notification-created.event';

@Injectable()
export class InAppChannel {
    @OnEvent(NotificationCreatedEvent.eventName)
    public async handle(event: NotificationCreatedEvent): Promise<void> {
        if (event.channel !== 'in_app') return;
        // For in-app notifications, the data is already persisted by the publisher.
        // This handler can be extended to add real-time delivery (SSE, WebSocket).
    }
}
