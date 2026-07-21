export class ConciliationMatchBuilder {
    private id: string;
    private conciliationId: string;
    private internalTxId: string;
    private externalTxId?: string;
    private status: string;
    private amountDiff: number = 0;
    private notes?: string;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setConciliationId(conciliationId: string): this {
        this.conciliationId = conciliationId;
        return this;
    }

    public setInternalTxId(internalTxId: string): this {
        this.internalTxId = internalTxId;
        return this;
    }

    public setExternalTxId(externalTxId?: string): this {
        this.externalTxId = externalTxId;
        return this;
    }

    public setStatus(status: string): this {
        this.status = status;
        return this;
    }

    public setAmountDiff(amountDiff: number): this {
        this.amountDiff = amountDiff;
        return this;
    }

    public setNotes(notes?: string): this {
        this.notes = notes;
        return this;
    }

    public build(): ConciliationMatch {
        return new ConciliationMatch(
            this.id,
            this.conciliationId,
            this.internalTxId,
            this.status,
            this.externalTxId,
            this.amountDiff,
            this.notes,
        );
    }
}

export class ConciliationMatch {
    public readonly id: string;
    public readonly conciliationId: string;
    public readonly internalTxId: string;
    public readonly externalTxId?: string;
    public readonly status: string;
    public readonly amountDiff: number;
    public readonly notes?: string;

    public constructor(
        id: string,
        conciliationId: string,
        internalTxId: string,
        status: string,
        externalTxId?: string,
        amountDiff: number = 0,
        notes?: string,
    ) {
        this.id = id;
        this.conciliationId = conciliationId;
        this.internalTxId = internalTxId;
        this.externalTxId = externalTxId;
        this.status = status;
        this.amountDiff = amountDiff;
        this.notes = notes;
    }

    public static get Builder(): ConciliationMatchBuilder {
        return new ConciliationMatchBuilder();
    }
}
