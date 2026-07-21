import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationEntity } from './infrastructure/persistence/typeorm/notification.entity';
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { NotificationRepository } from './infrastructure/persistence/typeorm/notification.repository';
import { NotificationsController } from './presentation/notifications.controller';
import { NotificationPublisher } from './application/publisher';
import { InAppChannel } from './infrastructure/channels/in-app.channel';
import { EmailHandler } from './application/handlers/email.handler';
import { TransactionCreatedHandler } from './application/handlers/transaction-created.handler';
import { OrderStatusChangedHandler } from './application/handlers/order-status-changed.handler';
import { ConciliationCompletedHandler } from './application/handlers/conciliation-completed.handler';
import { MarkNotificationReadHandler } from './application/commands/mark-notification-read/handler';
import { GetNotificationsHandler } from './application/queries/get-notifications/handler';
import { GetUnreadCountHandler } from './application/queries/get-unread-count/handler';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationEntity]), CqrsModule],
    controllers: [NotificationsController],
    providers: [
        {
            provide: NOTIFICATION_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new NotificationRepository(dataSource),
            inject: [DataSource],
        },
        NotificationPublisher,
        InAppChannel,
        EmailHandler,
        TransactionCreatedHandler,
        OrderStatusChangedHandler,
        ConciliationCompletedHandler,
        MarkNotificationReadHandler,
        GetNotificationsHandler,
        GetUnreadCountHandler,
    ],
})
export class NotificationsModule {}
