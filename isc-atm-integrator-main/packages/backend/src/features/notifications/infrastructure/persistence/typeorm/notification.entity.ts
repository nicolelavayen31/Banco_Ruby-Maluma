import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'type' })
    public type: string;

    @Column({ name: 'channel' })
    public channel: string;

    @Column({ name: 'recipient_id' })
    public recipientId: string;

    @Column({ name: 'title' })
    public title: string;

    @Column({ name: 'body', type: 'text' })
    public body: string;

    @Column({ name: 'data', type: 'jsonb', nullable: true })
    public data: Record<string, unknown>;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    public readAt?: Date;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
    public createdAt: Date;
}
