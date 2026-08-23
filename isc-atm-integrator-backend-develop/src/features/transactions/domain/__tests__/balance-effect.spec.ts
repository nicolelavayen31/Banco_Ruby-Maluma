import { calculateBalanceEffect } from '../balance-effect';
import { TRANSACTION_STATE, TRANSACTION_TYPE } from '../transaction';

describe('calculateBalanceEffect', () => {
    it('decreases the balance for a debit going pending -> success', () => {
        const effect = calculateBalanceEffect(
            TRANSACTION_STATE.PENDING,
            TRANSACTION_STATE.SUCCESS,
            TRANSACTION_TYPE.DEBIT,
            5000,
        );
        expect(effect).toBe(-5000);
    });

    it('increases the balance for a credit going pending -> success', () => {
        const effect = calculateBalanceEffect(
            TRANSACTION_STATE.PENDING,
            TRANSACTION_STATE.SUCCESS,
            TRANSACTION_TYPE.CREDIT,
            5000,
        );
        expect(effect).toBe(5000);
    });

    it('restores the balance for a debit going success -> reversed', () => {
        const effect = calculateBalanceEffect(
            TRANSACTION_STATE.SUCCESS,
            TRANSACTION_STATE.REVERSED,
            TRANSACTION_TYPE.DEBIT,
            5000,
        );
        expect(effect).toBe(5000);
    });

    it('removes the balance for a credit going success -> reversed', () => {
        const effect = calculateBalanceEffect(
            TRANSACTION_STATE.SUCCESS,
            TRANSACTION_STATE.REVERSED,
            TRANSACTION_TYPE.CREDIT,
            5000,
        );
        expect(effect).toBe(-5000);
    });

    it('returns 0 for a transition that does not move money', () => {
        const effect = calculateBalanceEffect(
            TRANSACTION_STATE.PENDING,
            TRANSACTION_STATE.CANCELLED,
            TRANSACTION_TYPE.DEBIT,
            5000,
        );
        expect(effect).toBe(0);
    });
});
