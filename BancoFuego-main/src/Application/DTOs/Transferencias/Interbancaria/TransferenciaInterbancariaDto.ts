export interface TransferenciaInterbancariaRequestDto {
    cuentaOrigenId: number;
    numeroCuentaDestino: string;
    codigoBancoDestino: string;
    monto: number;
    concepto?: string;
    idempotencyKey?: string;
    correoCliente?: string;
}


export type EstadoTransferenciaInterbancaria =
    | "PENDIENTE"
    | "EXITOSA"
    | "FALLIDA";

export interface CuentaOrigenInterbancariaDto {
    cuentaId: number;
    saldoAnterior: number;
    saldoNuevo: number;
}

export interface TransferenciaInterbancariaResponseDto {
    tipo: "TRANSFERENCIA_EXTERNA";

    origen: CuentaOrigenInterbancariaDto;

    transaccionId: number;

    estado: EstadoTransferenciaInterbancaria;

    referenciaExterna?: string;

    mensaje?: string;
}

export interface ConsultaTransferenciaInterbancariaResponseDto {
    transaccionId: number;

    referenciaExterna: string;

    estado: EstadoTransferenciaInterbancaria;

    mensaje?: string;

    actualizadoEn?: string;
}