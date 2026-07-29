export interface AutenticacionRequestDto {
    numeroTarjeta: string;
    pin: string;
}

export interface AutenticacionResponseDto {
    token: string;
    cuentaId: number;
    numeroCuenta: string;
    saldo: number;
    nombreCliente?: string;
    correoCliente?: string;
}