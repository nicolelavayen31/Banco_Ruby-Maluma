import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransactionCreatedEvent } from '@features/transactions/application/events/transaction-created.event';
import { NotificationPublisher } from '../publisher';

@Injectable()
export class TransactionCreatedHandler {
    constructor(private readonly publisher: NotificationPublisher) {}

    @OnEvent(TransactionCreatedEvent.eventName)
    public async handle(event: TransactionCreatedEvent): Promise<void> {
        const prefix = event.type === 'credit' ? 'Credit' : 'Debit';
        const amount =
            event.amount != null
                ? `$${(event.amount / 100).toFixed(2)}`
                : 'N/A';

        await this.publisher.publish({
            type: 'transaction.created',
            recipientId: event.accountId,
            title: `${prefix} transaction`,
            body: `A ${prefix.toLowerCase()} transaction of ${amount} has been created.`,
            data: {
                transactionId: event.transactionId,
                amount: event.amount,
                type: event.type,
                description: event.description,
                operation: event.operation,
            },
        });
    }
}
