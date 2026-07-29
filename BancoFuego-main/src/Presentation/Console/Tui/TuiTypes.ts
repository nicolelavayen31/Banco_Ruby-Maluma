import { NaturalezaMovimiento } from "../../../Domain/Enums/NaturalezaMovimiento";

export type PantallaTui =
    | "LOGIN_TARJETA"
    | "LOGIN_PIN"
    | "MENU_PRINCIPAL"
    | "DEPOSITO"
    | "RETIRO"
    | "SALDO"
    | "HISTORIAL"
    | "MENSAJE"
    | "CONFIRMAR_SALIDA"
    | "CONFIRMAR_CANCELACION"
    | "DESPEDIDA"
    | "CAMBIAR_PIN"
    | "TIPO_TRANSFERENCIA"
    | "TRANSFERENCIA_LOCAL"
    | "TRANSFERENCIA_INTERBANCARIA";

export interface SesionTui {
    token: string;
    cuentaId: number;
    numeroCuenta: string;
    saldo: number;
    nombreCliente?: string;
    correoCliente?: string;
}

export interface MensajeTui {
    titulo: string;
    contenido: string;
    error?: boolean;
}

export type PasoCambioPin =
    | "PIN_ACTUAL"
    | "PIN_NUEVO";

export type PasoTransferenciaLocal =
    | "CUENTA_DESTINO"
    | "MONTO";

export type PasoTransferenciaInterbancaria =
    | "BANCO_DESTINO"
    | "CUENTA_DESTINO"
    | "MONTO"
    | "CONCEPTO";

export interface HistorialItemTui {
    fecha: string | Date;
    tipo: string;
    naturaleza?: NaturalezaMovimiento;
    monto: number;
    saldoPosterior: number;
}

export interface ItemSeleccion {
    label: string;
    value: string;
}