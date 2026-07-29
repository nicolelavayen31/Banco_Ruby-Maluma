import { EstadoRespuestaInterbancaria } from "./EstadoRespuestaInterbancaria";

export interface RecibirTransferenciaInterbancariaRequestDto {
    bancoOrigen: string;
    numeroCuentaDestino: string;
    monto: number;
    concepto?: string;

    // ID único que asigna el banco emisor a la operación.
    referenciaExterna: string;
}

export interface RecibirTransferenciaInterbancariaResponseDto {
    estado: EstadoRespuestaInterbancaria;
    referenciaExterna: string;
    transaccionId?: number;
    codigoError?: string;
    mensaje?: string;
}