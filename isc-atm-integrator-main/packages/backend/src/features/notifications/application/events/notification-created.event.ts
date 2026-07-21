export class NotificationCreatedEvent {
    static readonly eventName = 'notification.created';

    constructor(
        public readonly notificationId: string,
        public readonly channel: string,
        public readonly recipientId: string,
        public readonly title: string,
        public readonly body: string,
        public readonly occurredOn: Date = new Date(),
    ) {}
}
