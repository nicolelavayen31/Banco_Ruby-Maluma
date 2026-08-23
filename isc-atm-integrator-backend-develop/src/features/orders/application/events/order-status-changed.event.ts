export class OrderStatusChangedEvent {
    static readonly eventName = 'order.status_changed';

    constructor(
        public readonly orderId: string,
        public readonly previousStatus: string,
        public readonly newStatus: string,
        public readonly customerName: string,
        public readonly occurredOn: Date = new Date(),
    ) {}
}
