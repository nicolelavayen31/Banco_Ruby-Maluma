import { TRANSACTION_STATE } from '@features/transactions/domain/transaction';

export type PairMatchStatus = 'matched' | 'amount_mismatch' | 'state_mismatch';

export interface PairClassification {
    status: PairMatchStatus;
    amountDiff: number;
}

function appliesMoney(state: string): boolean {
    return state === TRANSACTION_STATE.SUCCESS;
}

function isSettled(state: string): boolean {
    return state !== TRANSACTION_STATE.PENDING;
}

export function classifyPair(
    txA: { amount?: number; state: string },
    txB: { amount?: number; state: string },
): PairClassification {
    const amountDiff = (txA.amount ?? 0) - (txB.amount ?? 0);
    if (amountDiff !== 0) {
        return { status: 'amount_mismatch', amountDiff };
    }

    const bothApplied = appliesMoney(txA.state) && appliesMoney(txB.state);
    const bothSettledWithoutMoney =
        isSettled(txA.state) &&
        isSettled(txB.state) &&
        !appliesMoney(txA.state) &&
        !appliesMoney(txB.state);

    if (bothApplied || bothSettledWithoutMoney) {
        return { status: 'matched', amountDiff: 0 };
    }

    return { status: 'state_mismatch', amountDiff: 0 };
}
