import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IConciliationRepository } from '../../../domain/conciliation.repository';
import { Conciliation } from '../../../domain/conciliation';
import { ConciliationMatch } from '../../../domain/conciliation-match';
import { ConciliationEntity } from './conciliation.entity';
import { ConciliationMatchEntity } from './conciliation-match.entity';

@Injectable()
export class ConciliationRepository implements IConciliationRepository {
    constructor(private readonly dataSource: DataSource) {}

    public async createConciliation(conciliation: Conciliation): Promise<ConciliationEntity> {
        const entity = this.dataSource.getRepository(ConciliationEntity).create({
            id: conciliation.id,
            runAt: conciliation.runAt,
            status: conciliation.status,
            summary: conciliation.summary,
        });
        return this.dataSource.getRepository(ConciliationEntity).save(entity);
    }

    public async createMatch(match: ConciliationMatch): Promise<ConciliationMatchEntity> {
        const entity = this.dataSource.getRepository(ConciliationMatchEntity).create({
            id: match.id,
            conciliationId: match.conciliationId,
            internalTxId: match.internalTxId,
            externalTxId: match.externalTxId,
            status: match.status,
            amountDiff: match.amountDiff,
            notes: match.notes,
        });
        return this.dataSource.getRepository(ConciliationMatchEntity).save(entity);
    }

    public async findById(id: string): Promise<ConciliationEntity | null> {
        return this.dataSource.getRepository(ConciliationEntity).findOneBy({ id });
    }

    public async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.dataSource.getRepository(ConciliationEntity).findAndCount({
            skip,
            take: limit,
            order: { runAt: 'DESC' },
        });
        return { items, total, page, limit };
    }

    public async findMatchesByConciliationId(conciliationId: string): Promise<ConciliationMatchEntity[]> {
        return this.dataSource.getRepository(ConciliationMatchEntity).find({ where: { conciliationId } });
    }

    public async updateMatchStatus(matchId: string, status: string, notes?: string): Promise<void> {
        await this.dataSource.getRepository(ConciliationMatchEntity).update(matchId, { status, notes });
    }
}
