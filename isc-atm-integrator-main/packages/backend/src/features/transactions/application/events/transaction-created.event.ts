export class TransactionCreatedEvent {
    static readonly eventName = 'transaction.created';

    constructor(
        public readonly transactionId: string,
        public readonly accountId: string,
        public readonly amount: number,
        public readonly type: string,
        public readonly description: string,
        public readonly operation: string,
        public readonly occurredOn: Date = new Date(),
    ) {}
}
