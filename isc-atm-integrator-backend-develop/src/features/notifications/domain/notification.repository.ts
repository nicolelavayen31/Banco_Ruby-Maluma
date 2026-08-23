import { NotificationEntity } from '../infrastructure/persistence/typeorm/notification.entity';
import { Notification } from './notification';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
    save(notification: Notification): Promise<NotificationEntity>;
    findById(id: string): Promise<NotificationEntity | null>;
    findByRecipient(
        recipientId: string,
        page: number,
        limit: number,
        unreadOnly?: boolean,
    ): Promise<{
        items: NotificationEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
    countUnread(recipientId: string): Promise<number>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(recipientId: string): Promise<void>;
}
