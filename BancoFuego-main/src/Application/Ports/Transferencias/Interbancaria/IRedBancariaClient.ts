import { Dinero } from "../../../../Domain/ValueObjects/Dinero";

export interface SolicitudTransferenciaInterbancaria {
    bancoOrigen: string;
    bancoDestino: string;

    numeroCuentaOrigen: string;
    numeroCuentaDestino: string;

    monto: Dinero;
    concepto?: string;

    fecha: Date;
}

export type ResultadoTransferenciaInterbancaria =
    | {
        estado: "ACEPTADA";
        referenciaExterna: string;
        mensaje?: string;
    }
    | {
        estado: "RECHAZADA";
        codigoError: string;
        mensaje?: string;
    }
    | {
        estado: "PENDIENTE";
        referenciaExterna: string;
        mensaje?: string;
    };

export interface IRedBancariaClient {
    enviarTransferencia(
        solicitud: SolicitudTransferenciaInterbancaria
    ): Promise<ResultadoTransferenciaInterbancaria>;

    consultarEstado(
        referenciaExterna: string
    ): Promise<ResultadoTransferenciaInterbancaria>;
}