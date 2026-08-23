import { Test, TestingModule } from '@nestjs/testing';
import { GetConciliationsHandler } from '../handler';
import { GetConciliationsQuery } from '../query';
import { CONCILIATION_REPOSITORY } from '../../../../domain/conciliation.repository';
import { InMemoryConciliationRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { ConciliationEntity } from '../../../../infrastructure/persistence/typeorm/conciliation.entity';

describe('GetConciliationsHandler', () => {
    let handler: GetConciliationsHandler;
    let repo: InMemoryConciliationRepository;

    beforeEach(async () => {
        repo = new InMemoryConciliationRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetConciliationsHandler,
                { provide: CONCILIATION_REPOSITORY, useValue: repo },
            ],
        }).compile();

        handler = module.get(GetConciliationsHandler);
    });

    afterEach(() => {
        repo.reset();
    });

    it('should return empty list when no conciliations', async () => {
        const result = await handler.execute(new GetConciliationsQuery(1, 10));

        expect(result.data).toHaveLength(0);
        expect(result.metadata.pagination?.totalItems).toBe(0);
        expect(result.metadata.statusCode).toBe(200);
    });

    it('should return paginated conciliations', async () => {
        const items: ConciliationEntity[] = [];
        for (let i = 0; i < 5; i++) {
            const c = new ConciliationEntity();
            c.id = `conc-${i}`;
            c.runAt = new Date();
            c.status = 'completed';
            c.summary = { matched: i, discrepancies: 0, missing: 0 };
            items.push(c);
        }
        repo.seed(items);

        const result = await handler.execute(new GetConciliationsQuery(1, 3));

        expect(result.data).toHaveLength(3);
        expect(result.metadata.pagination?.totalItems).toBe(5);
        expect(result.metadata.pagination?.totalPages).toBe(2);
        expect(result.metadata.pagination?.page).toBe(1);
        expect(result.metadata.pagination?.limit).toBe(3);
        expect(result.metadata.pagination?.hasNextPage).toBe(true);
        expect(result.metadata.pagination?.hasPreviousPage).toBe(false);
    });

    it('should return second page correctly', async () => {
        const items: ConciliationEntity[] = [];
        for (let i = 0; i < 5; i++) {
            const c = new ConciliationEntity();
            c.id = `conc-${i}`;
            c.runAt = new Date();
            c.status = 'completed';
            c.summary = { matched: i, discrepancies: 0, missing: 0 };
            items.push(c);
        }
        repo.seed(items);

        const result = await handler.execute(new GetConciliationsQuery(2, 3));

        expect(result.data).toHaveLength(2);
        expect(result.metadata.pagination?.totalItems).toBe(5);
        expect(result.metadata.pagination?.totalPages).toBe(2);
        expect(result.metadata.pagination?.hasNextPage).toBe(false);
        expect(result.metadata.pagination?.hasPreviousPage).toBe(true);
    });

    it('should use default pagination values', async () => {
        const items: ConciliationEntity[] = [];
        for (let i = 0; i < 5; i++) {
            const c = new ConciliationEntity();
            c.id = `conc-${i}`;
            c.runAt = new Date();
            c.status = 'completed';
            c.summary = { matched: i, discrepancies: 0, missing: 0 };
            items.push(c);
        }
        repo.seed(items);

        const result = await handler.execute(new GetConciliationsQuery());

        expect(result.data).toHaveLength(5);
        expect(result.metadata.pagination?.limit).toBe(10);
        expect(result.metadata.statusCode).toBe(200);
    });
});
