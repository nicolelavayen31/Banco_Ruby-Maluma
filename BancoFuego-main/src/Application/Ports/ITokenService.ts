export interface DatosToken {
    cuentaId: number;
    numeroCuenta: string;
}

export interface ITokenService {
    generar(
        datos: DatosToken
    ): string;

    verificar(
        token: string
    ): DatosToken;
}