import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from '../events/notification-created.event';

@Injectable()
export class EmailHandler {
    @OnEvent(NotificationCreatedEvent.eventName)
    public async handle(event: NotificationCreatedEvent): Promise<void> {
        if (event.channel !== 'email') return;
        // TODO: Implement email sending when email service is available
    }
}
