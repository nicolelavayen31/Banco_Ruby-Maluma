export class ConciliationCompletedEvent {
    static readonly eventName = 'conciliation.completed';

    constructor(
        public readonly conciliationId: string,
        public readonly status: string,
        public readonly summary: Record<string, unknown>,
        public readonly occurredOn: Date = new Date(),
    ) {}
}
