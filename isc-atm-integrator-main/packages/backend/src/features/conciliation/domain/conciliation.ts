export class ConciliationBuilder {
    private id: string;
    private runAt: Date;
    private status: string = 'pending';
    private summary: { matched: number; discrepancies: number; missing: number } = { matched: 0, discrepancies: 0, missing: 0 };

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setRunAt(runAt: Date): this {
        this.runAt = runAt;
        return this;
    }

    public setStatus(status: string): this {
        this.status = status;
        return this;
    }

    public setSummary(summary: { matched: number; discrepancies: number; missing: number }): this {
        this.summary = summary;
        return this;
    }

    public build(): Conciliation {
        return new Conciliation(this.id, this.runAt, this.status, this.summary);
    }
}

export class Conciliation {
    public readonly id: string;
    public readonly runAt: Date;
    public readonly status: string;
    public readonly summary: { matched: number; discrepancies: number; missing: number };

    public constructor(
        id: string,
        runAt: Date,
        status: string,
        summary: { matched: number; discrepancies: number; missing: number },
    ) {
        this.id = id;
        this.runAt = runAt;
        this.status = status;
        this.summary = summary;
    }

    public static get Builder(): ConciliationBuilder {
        return new ConciliationBuilder();
    }
}
