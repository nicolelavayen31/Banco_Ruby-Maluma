import { NextFunction, Request, Response } from "express";
import {
    AutenticacionNoEncontradaError,
    BusinessRuleError,
    CuentaInactivaError,
    CuentaNoEncontradaError,
    DomainError,
    FondosInsuficientesError,
    MontoInvalidoError,
    OperacionNoSoportadaError,
    PinIncorrectoError,
    TarjetaBloqueadaError,
    TarjetaNoEncontradaError,
    TarjetaNoUsableError,
    TarjetaVencidaError,
    ValidationError
} from "../../../Domain/Errors/DomainErrors";
import logger from "../../../Shared/Logging/Logger";

type ConstructorError = new (...argumentos: any[]) => Error;

interface ConfiguracionError {
    tipo: ConstructorError;
    estadoHttp: number;
    codigo: string;
}

const erroresControlados: ConfiguracionError[] = [
    { tipo: PinIncorrectoError, estadoHttp: 401, codigo: "PIN_INCORRECTO" },
    { tipo: TarjetaNoEncontradaError, estadoHttp: 404, codigo: "TARJETA_NO_ENCONTRADA" },
    { tipo: AutenticacionNoEncontradaError, estadoHttp: 404, codigo: "AUTENTICACION_NO_ENCONTRADA" },
    { tipo: CuentaNoEncontradaError, estadoHttp: 404, codigo: "CUENTA_NO_ENCONTRADA" },
    { tipo: ValidationError, estadoHttp: 400, codigo: "VALIDACION_INVALIDA" },
    { tipo: MontoInvalidoError, estadoHttp: 400, codigo: "MONTO_INVALIDO" },
    { tipo: TarjetaBloqueadaError, estadoHttp: 409, codigo: "TARJETA_BLOQUEADA" },
    { tipo: TarjetaVencidaError, estadoHttp: 409, codigo: "TARJETA_VENCIDA" },
    { tipo: TarjetaNoUsableError, estadoHttp: 409, codigo: "TARJETA_NO_USABLE" },
    { tipo: CuentaInactivaError, estadoHttp: 409, codigo: "CUENTA_INACTIVA" },
    { tipo: FondosInsuficientesError, estadoHttp: 409, codigo: "FONDOS_INSUFICIENTES" },
    { tipo: OperacionNoSoportadaError, estadoHttp: 409, codigo: "OPERACION_NO_SOPORTADA" }
];

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const fecha = new Date().toISOString();
    const configuracion = obtenerConfiguracionError(error);

    if (configuracion && error instanceof Error) {
        responder(res, configuracion.estadoHttp, error.message, configuracion.codigo, fecha);
        return;
    }

    if (error instanceof BusinessRuleError) {
        responder(res, 409, error.message, "REGLA_NEGOCIO", fecha);
        return;
    }

    if (error instanceof DomainError) {
        responder(res, 422, error.message, "ERROR_DOMINIO", fecha);
        return;
    }

    registrarErrorNoControlado(error, req, res);
    responder(res, 500, "Ocurrió un error interno en el servidor", "ERROR_INTERNO", fecha);
}

function obtenerConfiguracionError(error: unknown): ConfiguracionError | undefined {
    return erroresControlados.find(configuracion => error instanceof configuracion.tipo);
}

function registrarErrorNoControlado(error: unknown, req: Request, res: Response): void {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    const ruta = `${req.method} ${req.originalUrl}`;
    const requestId = res.locals.requestId as string | undefined;

    logger.error(`Error no controlado en ${ruta}: ${mensaje}`, {
        requestId,
        ruta,
        stack: error instanceof Error ? error.stack : undefined
    });
}

function responder(
    res: Response,
    estadoHttp: number,
    mensaje: string,
    codigo: string,
    fecha: string
): void {
    
    const requestId = res.locals.requestId as string | undefined;
    res.status(estadoHttp).json({
        mensaje,
        codigo,
        ...(requestId ? { requestId } : {}),
        fecha
    });
}