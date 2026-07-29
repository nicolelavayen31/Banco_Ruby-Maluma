import {
    EstadoTransaccion
} from "../EstadoTransaccion";

export type EstadoTransferenciaInterbancaria =
    Exclude<
        EstadoTransaccion,
        "CANCELADA"
    >;