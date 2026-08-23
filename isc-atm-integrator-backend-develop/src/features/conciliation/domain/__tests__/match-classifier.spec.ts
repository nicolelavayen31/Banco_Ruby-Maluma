import { classifyPair } from '../match-classifier';
import { TRANSACTION_STATE } from '@features/transactions/domain/transaction';

describe('classifyPair', () => {
    it('matches two settled legs with the same amount and state', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.SUCCESS },
            { amount: 1000, state: TRANSACTION_STATE.SUCCESS },
        );
        expect(result).toEqual({ status: 'matched', amountDiff: 0 });
    });

    it('matches two reversed legs', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.REVERSED },
            { amount: 1000, state: TRANSACTION_STATE.REVERSED },
        );
        expect(result.status).toBe('matched');
    });

    it('reports an amount mismatch regardless of state', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.SUCCESS },
            { amount: 1200, state: TRANSACTION_STATE.SUCCESS },
        );
        expect(result.status).toBe('amount_mismatch');
        expect(result.amountDiff).toBe(-200);
    });

    it('reports a state mismatch when one leg settled and the other did not', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.SUCCESS },
            { amount: 1000, state: TRANSACTION_STATE.PENDING },
        );
        expect(result.status).toBe('state_mismatch');
    });

    it('reports a state mismatch between success and reversed', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.SUCCESS },
            { amount: 1000, state: TRANSACTION_STATE.REVERSED },
        );
        expect(result.status).toBe('state_mismatch');
    });

    it('matches a cancelled leg against a reversed leg — neither holds applied money', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.CANCELLED },
            { amount: 1000, state: TRANSACTION_STATE.REVERSED },
        );
        expect(result.status).toBe('matched');
    });

    it('matches two cancelled legs', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.CANCELLED },
            { amount: 1000, state: TRANSACTION_STATE.CANCELLED },
        );
        expect(result.status).toBe('matched');
    });

    it('reports a state mismatch between pending and cancelled', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.PENDING },
            { amount: 1000, state: TRANSACTION_STATE.CANCELLED },
        );
        expect(result.status).toBe('state_mismatch');
    });

    it('reports a state mismatch between pending and reversed', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.PENDING },
            { amount: 1000, state: TRANSACTION_STATE.REVERSED },
        );
        expect(result.status).toBe('state_mismatch');
    });

    it('reports a state mismatch when both legs are still pending', () => {
        const result = classifyPair(
            { amount: 1000, state: TRANSACTION_STATE.PENDING },
            { amount: 1000, state: TRANSACTION_STATE.PENDING },
        );
        expect(result.status).toBe('state_mismatch');
    });
});
