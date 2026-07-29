export const TIPOS_CUENTA = [

    "AHORRO",
    "CORRIENTE"
] as const;

export type TipoCuenta = (typeof TIPOS_CUENTA)[number];