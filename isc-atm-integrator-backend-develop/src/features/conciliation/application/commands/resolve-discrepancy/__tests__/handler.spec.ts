import { Test, TestingModule } from '@nestjs/testing';
import { ResolveDiscrepancyHandler } from '../handler';
import { ResolveDiscrepancyCommand } from '../command';
import { CONCILIATION_REPOSITORY } from '../../../../domain/conciliation.repository';
import { InMemoryConciliationRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { ConciliationEntity } from '../../../../infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '../../../../infrastructure/persistence/typeorm/conciliation-match.entity';

describe('ResolveDiscrepancyHandler', () => {
    let handler: ResolveDiscrepancyHandler;
    let repo: InMemoryConciliationRepository;

    beforeEach(async () => {
        repo = new InMemoryConciliationRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResolveDiscrepancyHandler,
                { provide: CONCILIATION_REPOSITORY, useValue: repo },
            ],
        }).compile();

        handler = module.get(ResolveDiscrepancyHandler);
    });

    afterEach(() => {
        repo.reset();
    });

    it('should update match status to resolved', async () => {
        const conciliation = new ConciliationEntity();
        conciliation.id = 'conc-1';
        conciliation.runAt = new Date();
        conciliation.status = 'completed';
        conciliation.summary = { matched: 1, discrepancies: 0, missing: 0 };

        const match = new ConciliationMatchEntity();
        match.id = 'match-1';
        match.conciliationId = 'conc-1';
        match.internalTxId = 'tx-1';
        match.status = 'discrepancy';
        match.amountDiff = -500;

        repo.seed([conciliation], [match]);

        const result = await handler.execute(
            new ResolveDiscrepancyCommand('match-1', 'Revisado y aprobado'),
        );

        expect(result.data).toBeNull();
        expect(result.metadata.statusCode).toBe(200);
        expect(result.metadata.message).toBe('Discrepancy resolved');

        const updated = (await repo.findMatchesByConciliationId('conc-1'))[0];
        expect(updated.status).toBe('resolved');
        expect(updated.notes).toBe('Revisado y aprobado');
    });

    it('should resolve without notes', async () => {
        const conciliation = new ConciliationEntity();
        conciliation.id = 'conc-2';
        conciliation.runAt = new Date();
        conciliation.status = 'completed';
        conciliation.summary = { matched: 0, discrepancies: 1, missing: 0 };

        const match = new ConciliationMatchEntity();
        match.id = 'match-2';
        match.conciliationId = 'conc-2';
        match.internalTxId = 'tx-2';
        match.status = 'discrepancy';
        match.amountDiff = 200;

        repo.seed([conciliation], [match]);

        await handler.execute(new ResolveDiscrepancyCommand('match-2'));

        const updated = (await repo.findMatchesByConciliationId('conc-2'))[0];
        expect(updated.status).toBe('resolved');
        expect(updated.notes).toBeUndefined();
    });

    it('should not throw when match does not exist', async () => {
        await expect(
            handler.execute(new ResolveDiscrepancyCommand('nonexistent')),
        ).resolves.toBeDefined();
    });
});
