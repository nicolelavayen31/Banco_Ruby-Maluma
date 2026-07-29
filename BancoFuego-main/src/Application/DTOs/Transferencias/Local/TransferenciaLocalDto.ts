export interface TransferenciaLocalRequestDto {
    cuentaOrigenId: number;
    cuentaDestinoId: number;
    monto: number;
    idempotencyKey?: string;
    correoCliente?: string;
}


export interface CuentaTransferenciaLocalDto {
    cuentaId: number;
    saldoAnterior: number;
    saldoNuevo: number;
}

export interface TransferenciaLocalResponseDto {
    tipo: "TRANSFERENCIA_INTERNA";

    origen: CuentaTransferenciaLocalDto;

    destino: CuentaTransferenciaLocalDto;

    transaccionId: number;
}