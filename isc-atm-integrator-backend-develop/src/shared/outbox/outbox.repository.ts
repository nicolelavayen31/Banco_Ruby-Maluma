import type { OutboxEventEntity, OutboxStatus } from './outbox-event.entity';

export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');

export interface IOutboxRepository {
    saveEvent(event: OutboxEventEntity): Promise<void>;
    findPending(limit?: number): Promise<OutboxEventEntity[]>;
    markStatus(id: string, status: OutboxStatus): Promise<void>;
    incrementRetry(id: string): Promise<void>;
    findDeadLetters(): Promise<OutboxEventEntity[]>;
}
