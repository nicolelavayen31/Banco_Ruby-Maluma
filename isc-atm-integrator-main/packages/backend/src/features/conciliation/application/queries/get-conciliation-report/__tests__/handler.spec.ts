import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetConciliationReportHandler } from '../handler';
import { GetConciliationReportQuery } from '../query';
import { CONCILIATION_REPOSITORY } from '../../../../domain/conciliation.repository';
import { InMemoryConciliationRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { ConciliationEntity } from '../../../../infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../../../../infrastructure/persistence/typeorm/conciliation-match.entity';

describe('GetConciliationReportHandler', () => {
    let handler: GetConciliationReportHandler;
    let repo: InMemoryConciliationRepository;

    beforeEach(async () => {
        repo = new InMemoryConciliationRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetConciliationReportHandler,
                { provide: CONCILIATION_REPOSITORY, useValue: repo },
            ],
        }).compile();

        handler = module.get(GetConciliationReportHandler);
    });

    afterEach(() => {
        repo.reset();
    });

    it('should throw when conciliation not found', async () => {
        await expect(
            handler.execute(new GetConciliationReportQuery('nonexistent')),
        ).rejects.toThrow(NotFoundException);
    });

    it('should return conciliation with matches', async () => {
        const conciliation = new ConciliationEntity();
        conciliation.id = 'conc-1';
        conciliation.runAt = new Date();
        conciliation.status = 'completed';
        conciliation.summary = { matched: 2, discrepancies: 0, missing: 0 };

        const matches = [];
        for (let i = 0; i < 2; i++) {
            const m = new ConciliationMatchEntity();
            m.id = `match-${i}`;
            m.conciliationId = 'conc-1';
            m.internalTxId = `tx-${i}`;
            m.status = 'matched';
            m.amountDiff = 0;
            matches.push(m);
        }
        repo.seed([conciliation], matches);

        const result = await handler.execute(new GetConciliationReportQuery('conc-1'));

        expect(result.data.conciliation.id).toBe('conc-1');
        expect(result.data.matches).toHaveLength(2);
        expect(result.metadata.statusCode).toBe(200);
    });

    it('should return empty matches list when none exist', async () => {
        const conciliation = new ConciliationEntity();
        conciliation.id = 'conc-2';
        conciliation.runAt = new Date();
        conciliation.status = 'completed';
        conciliation.summary = { matched: 1, discrepancies: 0, missing: 0 };

        repo.seed([conciliation]);

        const result = await handler.execute(new GetConciliationReportQuery('conc-2'));

        expect(result.data.conciliation.id).toBe('conc-2');
        expect(result.data.matches).toHaveLength(0);
        expect(result.metadata.statusCode).toBe(200);
        expect(result.metadata.message).toBe('OK');
    });
});
