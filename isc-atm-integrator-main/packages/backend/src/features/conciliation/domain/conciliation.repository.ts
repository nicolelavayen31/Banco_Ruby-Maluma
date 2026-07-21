import { ConciliationEntity } from '../infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../infrastructure/persistence/typeorm/conciliation-match.entity';
import { Conciliation } from './conciliation';
import { ConciliationMatch } from './conciliation-match';

export const CONCILIATION_REPOSITORY = Symbol('CONCILIATION_REPOSITORY');

export interface IConciliationRepository {
    createConciliation(conciliation: Conciliation): Promise<ConciliationEntity>;
    createMatch(match: ConciliationMatch): Promise<ConciliationMatchEntity>;
    findById(id: string): Promise<ConciliationEntity | null>;
    findAll(page: number, limit: number): Promise<{ items: ConciliationEntity[]; total: number; page: number; limit: number }>;
    findMatchesByConciliationId(conciliationId: string): Promise<ConciliationMatchEntity[]>;
    updateMatchStatus(matchId: string, status: string, notes?: string): Promise<void>;
}
