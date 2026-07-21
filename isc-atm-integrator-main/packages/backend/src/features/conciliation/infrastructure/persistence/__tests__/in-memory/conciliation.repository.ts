import { randomUUID } from 'node:crypto';
import { IConciliationRepository } from '../../../../domain/conciliation.repository';
import { ConciliationEntity } from '../../typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../../typeorm/conciliation-match.entity';
import { Conciliation } from '../../../../domain/conciliation';
import { ConciliationMatch } from '../../../../domain/conciliation-match';

export class InMemoryConciliationRepository implements IConciliationRepository {
    private conciliations: Map<string, ConciliationEntity> = new Map();
    private matches: Map<string, ConciliationMatchEntity> = new Map();
    private nextId = 1;

    public async createConciliation(conciliation: Conciliation): Promise<ConciliationEntity> {
        const entity = new ConciliationEntity();
        entity.id = conciliation.id;
        entity.runAt = conciliation.runAt;
        entity.status = conciliation.status;
        entity.summary = conciliation.summary;
        this.conciliations.set(entity.id, entity);
        return entity;
    }

    public async createMatch(match: ConciliationMatch): Promise<ConciliationMatchEntity> {
        const entity = new ConciliationMatchEntity();
        entity.id = match.id;
        entity.conciliationId = match.conciliationId;
        entity.internalTxId = match.internalTxId;
        entity.externalTxId = match.externalTxId;
        entity.status = match.status;
        entity.amountDiff = match.amountDiff;
        entity.notes = match.notes;
        this.matches.set(entity.id, entity);
        return entity;
    }

    public async findById(id: string): Promise<ConciliationEntity | null> {
        return this.conciliations.get(id) ?? null;
    }

    public async findAll(page: number, limit: number): Promise<{
        items: ConciliationEntity[];
        total: number;
        page: number;
        limit: number;
    }> {
        const all = Array.from(this.conciliations.values());
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return { items, total: all.length, page, limit };
    }

    public async findMatchesByConciliationId(conciliationId: string): Promise<ConciliationMatchEntity[]> {
        return Array.from(this.matches.values())
            .filter(m => m.conciliationId === conciliationId);
    }

    public async updateMatchStatus(matchId: string, status: string, notes?: string): Promise<void> {
        const match = this.matches.get(matchId);
        if (match) {
            match.status = status;
            if (notes !== undefined) match.notes = notes;
        }
    }

    public seed(conciliations: ConciliationEntity[], matches: ConciliationMatchEntity[] = []): void {
        for (const c of conciliations) {
            this.conciliations.set(c.id, c);
        }
        for (const m of matches) {
            this.matches.set(m.id, m);
        }
    }

    public reset(): void {
        this.conciliations.clear();
        this.matches.clear();
    }
}
