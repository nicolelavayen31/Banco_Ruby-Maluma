import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { IOutboxRepository } from './outbox.repository';
import { OutboxEventEntity, type OutboxStatus } from './outbox-event.entity';

@Injectable()
export class OutboxTypeOrmRepository
    extends Repository<OutboxEventEntity>
    implements IOutboxRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(OutboxEventEntity, dataSource.createEntityManager());
    }

    public async saveEvent(event: OutboxEventEntity): Promise<void> {
        await this.insert(event);
    }

    public async findPending(limit = 10): Promise<OutboxEventEntity[]> {
        return this.find({
            where: { status: 'pending' },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }

    public async markStatus(id: string, status: OutboxStatus): Promise<void> {
        await this.update(id, { status, lastAttemptAt: new Date() });
    }

    public async incrementRetry(id: string): Promise<void> {
        await this.increment({ id }, 'retryCount', 1);
    }

    public async findDeadLetters(): Promise<OutboxEventEntity[]> {
        return this.find({ where: { status: 'dead_letter' } });
    }
}
