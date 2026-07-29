export const TIPOS_TRANSACCION = [

    "DEPOSITO",
    "RETIRO",
    "TRANSFERENCIA_INTERNA",
    "TRANSFERENCIA_EXTERNA",
    "TRANSFERENCIA_ENTRANTE",

] as const;

export type TipoTransaccion = (typeof TIPOS_TRANSACCION)[number];