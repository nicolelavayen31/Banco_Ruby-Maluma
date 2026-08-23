import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatusChangedEvent } from '@features/orders/application/events/order-status-changed.event';
import { NotificationPublisher } from '../publisher';

@Injectable()
export class OrderStatusChangedHandler {
    constructor(private readonly publisher: NotificationPublisher) {}

    @OnEvent(OrderStatusChangedEvent.eventName)
    public async handle(event: OrderStatusChangedEvent): Promise<void> {
        await this.publisher.publish({
            type: 'order.status_changed',
            recipientId: event.orderId,
            title: 'Order status changed',
            body: `Order for ${event.customerName} changed from ${event.previousStatus} to ${event.newStatus}.`,
            data: {
                orderId: event.orderId,
                previousStatus: event.previousStatus,
                newStatus: event.newStatus,
                customerName: event.customerName,
            },
        });
    }
}
