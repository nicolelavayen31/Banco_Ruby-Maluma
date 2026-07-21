import { ConciliationMatch } from '../conciliation-match';

describe('ConciliationMatch', () => {
    describe('Builder', () => {
        it('should build a ConciliationMatch with all required fields', () => {
            const match = ConciliationMatch.Builder
                .setId('match-1')
                .setConciliationId('conc-1')
                .setInternalTxId('tx-internal-1')
                .setExternalTxId('tx-external-1')
                .setStatus('matched')
                .setAmountDiff(0)
                .setNotes('All good')
                .build();

            expect(match).toBeInstanceOf(ConciliationMatch);
            expect(match.id).toBe('match-1');
            expect(match.conciliationId).toBe('conc-1');
            expect(match.internalTxId).toBe('tx-internal-1');
            expect(match.externalTxId).toBe('tx-external-1');
            expect(match.status).toBe('matched');
            expect(match.amountDiff).toBe(0);
            expect(match.notes).toBe('All good');
        });

        it('should build without optional fields', () => {
            const match = ConciliationMatch.Builder
                .setId('match-2')
                .setConciliationId('conc-1')
                .setInternalTxId('tx-internal-2')
                .setStatus('missing')
                .build();

            expect(match.id).toBe('match-2');
            expect(match.externalTxId).toBeUndefined();
            expect(match.amountDiff).toBe(0);
            expect(match.notes).toBeUndefined();
        });

        it('should use default amountDiff of 0 when not set', () => {
            const match = ConciliationMatch.Builder
                .setId('match-3')
                .setConciliationId('conc-1')
                .setInternalTxId('tx-3')
                .setStatus('discrepancy')
                .build();

            expect(match.amountDiff).toBe(0);
        });

        it('should accept externalTxId as optional', () => {
            const withExternal = ConciliationMatch.Builder
                .setId('m1').setConciliationId('c1').setInternalTxId('i1').setStatus('matched')
                .setExternalTxId('ext-1')
                .build();
            expect(withExternal.externalTxId).toBe('ext-1');

            const withoutExternal = ConciliationMatch.Builder
                .setId('m2').setConciliationId('c1').setInternalTxId('i2').setStatus('matched')
                .build();
            expect(withoutExternal.externalTxId).toBeUndefined();
        });

        it('should support method chaining', () => {
            const builder = ConciliationMatch.Builder
                .setId('id')
                .setConciliationId('cid')
                .setInternalTxId('tid')
                .setStatus('matched');

            expect(builder.setId('x')).toBe(builder);
            expect(builder.setNotes).toBeDefined();
            expect(builder.setAmountDiff).toBeDefined();
        });
    });

    describe('constructor', () => {
        it('should create a match directly with all fields', () => {
            const match = new ConciliationMatch(
                'id',
                'concId',
                'intTxId',
                'discrepancy',
                'extTxId',
                -500,
                'notes here',
            );

            expect(match.id).toBe('id');
            expect(match.conciliationId).toBe('concId');
            expect(match.internalTxId).toBe('intTxId');
            expect(match.externalTxId).toBe('extTxId');
            expect(match.status).toBe('discrepancy');
            expect(match.amountDiff).toBe(-500);
            expect(match.notes).toBe('notes here');
        });

        it('should create a match with default amountDiff', () => {
            const match = new ConciliationMatch(
                'id', 'concId', 'intTxId', 'matched', 'extTxId',
            );
            expect(match.amountDiff).toBe(0);
            expect(match.notes).toBeUndefined();
        });

        it('should create a match with partial fields', () => {
            const match = new ConciliationMatch(
                'id', 'concId', 'intTxId', 'discrepancy', 'extTxId',
            );
            expect(match.id).toBe('id');
            expect(match.conciliationId).toBe('concId');
            expect(match.internalTxId).toBe('intTxId');
            expect(match.externalTxId).toBe('extTxId');
            expect(match.status).toBe('discrepancy');
            expect(match.amountDiff).toBe(0);
            expect(match.notes).toBeUndefined();
        });
    });

    describe('status values', () => {
        it('should support matched status', () => {
            const match = ConciliationMatch.Builder
                .setId('m1').setConciliationId('c1').setInternalTxId('t1').setStatus('matched')
                .build();
            expect(match.status).toBe('matched');
        });

        it('should support discrepancy status', () => {
            const match = ConciliationMatch.Builder
                .setId('m2').setConciliationId('c1').setInternalTxId('t2').setStatus('discrepancy')
                .setAmountDiff(-500)
                .build();
            expect(match.status).toBe('discrepancy');
            expect(match.amountDiff).toBe(-500);
        });

        it('should support missing status', () => {
            const match = ConciliationMatch.Builder
                .setId('m3').setConciliationId('c1').setInternalTxId('t3').setStatus('missing')
                .build();
            expect(match.status).toBe('missing');
        });

        it('should support resolved status', () => {
            const match = ConciliationMatch.Builder
                .setId('m4').setConciliationId('c1').setInternalTxId('t4').setStatus('resolved')
                .setNotes('Fixed manually')
                .build();
            expect(match.status).toBe('resolved');
            expect(match.notes).toBe('Fixed manually');
        });
    });
});
