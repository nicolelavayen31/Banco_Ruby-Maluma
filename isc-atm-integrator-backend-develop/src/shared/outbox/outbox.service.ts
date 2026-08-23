import { Inject, Injectable } from '@nestjs/common';
import { OUTBOX_REPOSITORY } from './outbox.repository';
import type { IOutboxRepository } from './outbox.repository';
import { OutboxEventEntity } from './outbox-event.entity';
import type { OutboxStatus } from './outbox-event.entity';
import { randomUUID } from 'node:crypto';

export interface OutboxEventPayload {
    aggregateId: string;
    eventType: string;
    payload: Record<string, any>;
}

@Injectable()
export class OutboxService {
    constructor(
        @Inject(OUTBOX_REPOSITORY)
        private readonly repository: IOutboxRepository,
    ) {}

    public async save(eventPayload: OutboxEventPayload): Promise<void> {
        const event = new OutboxEventEntity();
        event.id = randomUUID();
        event.aggregateId = eventPayload.aggregateId;
        event.eventType = eventPayload.eventType;
        event.payload = eventPayload.payload;
        event.status = 'pending';
        event.retryCount = 0;
        event.maxRetries = 5;
        event.createdAt = new Date();

        await this.repository.saveEvent(event);
    }

    public async findPending(limit?: number): Promise<OutboxEventEntity[]> {
        return this.repository.findPending(limit);
    }

    public async markStatus(id: string, status: OutboxStatus): Promise<void> {
        await this.repository.markStatus(id, status);
    }

    public async incrementRetry(id: string): Promise<void> {
        await this.repository.incrementRetry(id);
    }

    public async processPending(): Promise<number> {
        const pending = await this.repository.findPending(10);
        return pending.length;
    }
}
