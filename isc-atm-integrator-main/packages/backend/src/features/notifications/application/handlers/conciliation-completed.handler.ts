import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConciliationCompletedEvent } from '@features/conciliation/application/events/conciliation-completed.event';
import { NotificationPublisher } from '../publisher';

@Injectable()
export class ConciliationCompletedHandler {
    constructor(private readonly publisher: NotificationPublisher) {}

    @OnEvent(ConciliationCompletedEvent.eventName)
    public async handle(event: ConciliationCompletedEvent): Promise<void> {
        await this.publisher.publish({
            type: 'conciliation.completed',
            recipientId: event.conciliationId,
            title: 'Conciliation completed',
            body: `Conciliation finished with status: ${event.status}.`,
            data: {
                conciliationId: event.conciliationId,
                status: event.status,
                summary: event.summary,
            },
        });
    }
}
