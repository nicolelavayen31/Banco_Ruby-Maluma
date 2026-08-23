import { TRANSACTION_TYPE, TRANSACTION_STATE } from './transaction';

const BALANCE_EFFECT_DIRECTION: Record<string, number> = {
    [`${TRANSACTION_STATE.PENDING}->${TRANSACTION_STATE.SUCCESS}`]: 1,
    [`${TRANSACTION_STATE.SUCCESS}->${TRANSACTION_STATE.REVERSED}`]: -1,
};

export function calculateBalanceEffect(
    previousState: string,
    newState: string,
    type: string | undefined,
    amount: number,
): number {
    const direction = BALANCE_EFFECT_DIRECTION[`${previousState}->${newState}`];
    if (!direction) {
        return 0;
    }

    const sign = type === TRANSACTION_TYPE.DEBIT ? -1 : 1;
    return direction * sign * amount;
}
