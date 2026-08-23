import { Entity, PrimaryColumn, Column } from 'typeorm';

export type OutboxStatus = 'pending' | 'sent' | 'failed' | 'dead_letter';

@Entity('outbox_event')
export class OutboxEventEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'aggregate_id', type: 'uuid' })
    public aggregateId: string;

    @Column({ name: 'event_type', type: 'varchar' })
    public eventType: string;

    @Column({ name: 'payload', type: 'jsonb' })
    public payload: Record<string, any>;

    @Column({ name: 'status', type: 'varchar', default: 'pending' })
    public status: OutboxStatus;

    @Column({ name: 'retry_count', type: 'int', default: 0 })
    public retryCount: number;

    @Column({ name: 'max_retries', type: 'int', default: 5 })
    public maxRetries: number;

    @Column({ name: 'last_attempt_at', type: 'timestamp', nullable: true })
    public lastAttemptAt?: Date;

    @Column({ name: 'created_at', type: 'timestamp' })
    public createdAt: Date;
}
