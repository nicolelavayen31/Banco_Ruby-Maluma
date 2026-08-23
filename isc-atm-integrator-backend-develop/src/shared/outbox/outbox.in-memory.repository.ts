import type { IOutboxRepository } from './outbox.repository';
import { OutboxEventEntity, type OutboxStatus } from './outbox-event.entity';

export class OutboxInMemoryRepository implements IOutboxRepository {
    private events: Map<string, OutboxEventEntity> = new Map();

    public async saveEvent(event: OutboxEventEntity): Promise<void> {
        this.events.set(event.id, event);
        await Promise.resolve();
    }

    public async findPending(limit = 10): Promise<OutboxEventEntity[]> {
        await Promise.resolve();
        return Array.from(this.events.values())
            .filter((e) => e.status === 'pending')
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, limit);
    }

    public async markStatus(id: string, status: OutboxStatus): Promise<void> {
        await Promise.resolve();
        const event = this.events.get(id);
        if (event) {
            event.status = status;
            event.lastAttemptAt = new Date();
        }
    }

    public async incrementRetry(id: string): Promise<void> {
        await Promise.resolve();
        const event = this.events.get(id);
        if (event) {
            event.retryCount += 1;
        }
    }

    public async findDeadLetters(): Promise<OutboxEventEntity[]> {
        await Promise.resolve();
        return Array.from(this.events.values()).filter(
            (e) => e.status === 'dead_letter',
        );
    }

    public seed(events: OutboxEventEntity[]): void {
        for (const event of events) {
            this.events.set(event.id, event);
        }
    }

    public reset(): void {
        this.events.clear();
    }

    public getAll(): OutboxEventEntity[] {
        return Array.from(this.events.values());
    }
}
