import { AgreementEntity } from '../infrastructure/persistence/typeorm/agreement.entity';
import { Agreement } from './agreement';

export const AGREEMENT_REPOSITORY = Symbol('AGREEMENT_REPOSITORY');

export interface IAgreementRepository {
    save(agreement: Agreement): Promise<AgreementEntity>;
    findById(id: string): Promise<AgreementEntity | null>;
    findAll(
        page: number,
        limit: number,
        state?: string,
    ): Promise<{
        items: AgreementEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
