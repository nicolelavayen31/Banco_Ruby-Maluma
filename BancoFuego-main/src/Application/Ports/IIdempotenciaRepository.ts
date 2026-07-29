export type TipoOperacionIdempotente =
    | "DEPOSITO"
    | "RETIRO"
    | "TRANSFERENCIA";

export type EstadoRegistroIdempotencia =
    | "EN_PROCESO"
    | "COMPLETADA";

export interface RegistroIdempotencia {
    cuentaId: number;
    operacion: TipoOperacionIdempotente;
    clave: string;
    hashSolicitud: string;
    estado: EstadoRegistroIdempotencia;
    codigoRespuesta?: number;
    cuerpoRespuesta?: unknown;
}

export interface ResultadoInicioIdempotenciaNueva {
    tipo: "NUEVA";
}

export interface ResultadoInicioIdempotenciaRepetida {
    tipo: "REPETIDA";
    codigoRespuesta: number;
    cuerpoRespuesta: unknown;
}

export interface ResultadoInicioIdempotenciaConflicto {
    tipo: "CONFLICTO";
    mensaje: string;
}

export type ResultadoInicioIdempotencia =
    | ResultadoInicioIdempotenciaNueva
    | ResultadoInicioIdempotenciaRepetida
    | ResultadoInicioIdempotenciaConflicto;

export interface IIdempotenciaRepository {
    iniciar(
        cuentaId: number,
        operacion: TipoOperacionIdempotente,
        clave: string,
        hashSolicitud: string
    ): Promise<ResultadoInicioIdempotencia>;

    completar(
        cuentaId: number,
        operacion: TipoOperacionIdempotente,
        clave: string,
        codigoRespuesta: number,
        cuerpoRespuesta: unknown
    ): Promise<void>;
}