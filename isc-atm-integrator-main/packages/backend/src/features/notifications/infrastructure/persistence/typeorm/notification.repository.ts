import { DataSource, Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { INotificationRepository } from '@features/notifications/domain/notification.repository';
import { Notification } from '@features/notifications/domain/notification';

export class NotificationRepository implements INotificationRepository
{
    private readonly repo: Repository<NotificationEntity>;

    constructor(dataSource: DataSource) {
        this.repo = new Repository(NotificationEntity, dataSource.createEntityManager());
    }

    public async save(notification: Notification): Promise<NotificationEntity> {
        const entity = this.repo.create({
            id: notification.id,
            type: notification.type,
            channel: notification.channel,
            recipientId: notification.recipientId,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
        });
        return this.repo.save(entity);
    }

    public async findById(id: string): Promise<NotificationEntity | null> {
        return this.repo.findOneBy({ id });
    }

    public async findByRecipient(
        recipientId: string,
        page: number,
        limit: number,
        unreadOnly?: boolean,
    ): Promise<{
        items: NotificationEntity[];
        total: number;
        page: number;
        limit: number;
    }> {
        const where: Record<string, unknown> = { recipientId };
        if (unreadOnly) {
            where.readAt = null;
        }

        const [items, total] = await this.repo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total, page, limit };
    }

    public async countUnread(recipientId: string): Promise<number> {
        const qb = this.repo.createQueryBuilder('n');
        return qb.where('n.recipientId = :recipientId', { recipientId })
            .andWhere('n.readAt IS NULL')
            .getCount();
    }

    public async markAsRead(id: string): Promise<void> {
        await this.repo.update(id, { readAt: new Date() });
    }

    public async markAllAsRead(recipientId: string): Promise<void> {
        await this.repo.update(
            { recipientId, readAt: null as unknown as undefined },
            { readAt: new Date() },
        );
    }
}
