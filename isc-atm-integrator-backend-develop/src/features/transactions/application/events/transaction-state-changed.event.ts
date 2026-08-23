export class TransactionStateChangedEvent {
    static readonly eventName = 'transaction.state_changed';

    constructor(
        public readonly transactionId: string,
        public readonly previousState: string,
        public readonly newState: string,
        public readonly amount?: number,
        public readonly operation?: string,
        public readonly type?: string,
        public readonly description?: string,
        public readonly bankAccountId?: string,
        public readonly correlationId?: string,
        public readonly sourceBank?: string,
        public readonly occurredOn: Date = new Date(),
    ) {}
}
