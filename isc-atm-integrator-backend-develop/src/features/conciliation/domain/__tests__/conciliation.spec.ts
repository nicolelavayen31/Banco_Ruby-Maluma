import { Conciliation } from '../conciliation';

describe('Conciliation', () => {
    describe('Builder', () => {
        it('should build a Conciliation with all required fields', () => {
            const now = new Date();
            const conciliation = Conciliation.Builder.setId(
                '123e4567-e89b-12d3-a456-426614174000',
            )
                .setRunAt(now)
                .setStatus('completed')
                .setSummary({ matched: 5, discrepancies: 2, missing: 1 })
                .build();

            expect(conciliation).toBeInstanceOf(Conciliation);
            expect(conciliation.id).toBe(
                '123e4567-e89b-12d3-a456-426614174000',
            );
            expect(conciliation.runAt).toBe(now);
            expect(conciliation.status).toBe('completed');
            expect(conciliation.summary).toEqual({
                matched: 5,
                discrepancies: 2,
                missing: 1,
            });
        });

        it('should use default status "pending" when not set', () => {
            const conciliation = Conciliation.Builder.setId('id-1')
                .setRunAt(new Date())
                .setSummary({ matched: 0, discrepancies: 0, missing: 0 })
                .build();

            expect(conciliation.status).toBe('pending');
        });

        it('should use default summary with zeros when not set', () => {
            const conciliation = Conciliation.Builder.setId('id-1')
                .setRunAt(new Date())
                .setStatus('completed')
                .build();

            expect(conciliation.summary).toEqual({
                matched: 0,
                discrepancies: 0,
                missing: 0,
            });
        });

        it('should support method chaining', () => {
            const conciliation = Conciliation.Builder.setId('id-1')
                .setRunAt(new Date())
                .setStatus('completed')
                .setSummary({ matched: 1, discrepancies: 0, missing: 0 });

            expect(conciliation.setId('id-2')).toBe(conciliation);
            expect(conciliation.setRunAt).toBeDefined();
            expect(conciliation.setStatus).toBeDefined();
            expect(conciliation.setSummary).toBeDefined();
        });

        it('should allow overriding values before build', () => {
            const conciliation = Conciliation.Builder.setId('id-1')
                .setStatus('pending')
                .setId('id-2')
                .setStatus('completed')
                .setRunAt(new Date())
                .setSummary({ matched: 0, discrepancies: 0, missing: 0 })
                .build();

            expect(conciliation.id).toBe('id-2');
            expect(conciliation.status).toBe('completed');
        });
    });

    describe('constructor', () => {
        it('should create a Conciliation directly', () => {
            const now = new Date();
            const conciliation = new Conciliation('abc-123', now, 'pending', {
                matched: 0,
                discrepancies: 0,
                missing: 0,
            });

            expect(conciliation.id).toBe('abc-123');
            expect(conciliation.runAt).toBe(now);
            expect(conciliation.status).toBe('pending');
            expect(conciliation.summary.matched).toBe(0);
        });
    });
});
