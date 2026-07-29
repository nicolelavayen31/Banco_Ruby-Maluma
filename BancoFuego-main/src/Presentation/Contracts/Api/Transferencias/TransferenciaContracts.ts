import { EstadoTransferenciaInterbancaria } from "../../../../Domain/Enums/Transferencias/EstadoTransferenciaInterbancaria";

export type TipoTransferencia =
    | "LOCAL"
    | "INTERBANCARIA";

export interface TransferenciaLocalRequest {
    tipoTransferencia: "LOCAL";
    numeroCuentaDestino: string;
    monto: number;
}

export interface TransferenciaInterbancariaRequest {
    tipoTransferencia: "INTERBANCARIA";
    numeroCuentaDestino: string;
    codigoBancoDestino: string;
    monto: number;
    concepto?: string;
}

export type TransferenciaRequest =
    | TransferenciaLocalRequest
    | TransferenciaInterbancariaRequest;

export interface CuentaTransferenciaResponse {
    cuentaId: number;
    saldoAnterior: number;
    saldoNuevo: number;
}

export interface TransferenciaLocalResponse {
    tipo: "TRANSFERENCIA_INTERNA";
    origen: CuentaTransferenciaResponse;
    destino: CuentaTransferenciaResponse;
    transaccionId: number;
}


export interface TransferenciaInterbancariaResponse {
    tipo: "TRANSFERENCIA_EXTERNA";
    origen: CuentaTransferenciaResponse;
    transaccionId: number;
    estado: EstadoTransferenciaInterbancaria;
    referenciaExterna?: string;
    mensaje?: string;
}

export interface ConsultaTransferenciaInterbancariaResponse {
    transaccionId: number;
    referenciaExterna: string;
    estado: EstadoTransferenciaInterbancaria;
    mensaje?: string;
    actualizadoEn?: string;
}

export type TransferenciaResponse =
    | TransferenciaLocalResponse
    | TransferenciaInterbancariaResponse;

export function esTransferenciaLocal(
    respuesta: TransferenciaResponse
): respuesta is TransferenciaLocalResponse {
    return (
        respuesta.tipo ===
        "TRANSFERENCIA_INTERNA"
    );
}

export function esTransferenciaInterbancaria(
    respuesta: TransferenciaResponse
): respuesta is TransferenciaInterbancariaResponse {
    return (
        respuesta.tipo ===
        "TRANSFERENCIA_EXTERNA"
    );
}