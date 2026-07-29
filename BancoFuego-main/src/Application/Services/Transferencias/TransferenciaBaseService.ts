import { IIdempotenciaRepository } from "../../Ports/IIdempotenciaRepository";
import { BusinessRuleError } from "../../../Domain/Errors/DomainErrors";

export interface ResultadoIdempotencia<T> {
    repetida: boolean;
    respuesta?: T;
}

export abstract class TransferenciaBaseService {
    protected async comprobarIdempotencia<T>(
        repositorio: IIdempotenciaRepository,
        cuentaOrigenId: number,
        clave: string | undefined,
        hashSolicitud: string | undefined
    ): Promise<ResultadoIdempotencia<T>> {
        if (!clave || !hashSolicitud) {
            return {
                repetida: false
            };
        }

        const resultado = await repositorio.iniciar(
            cuentaOrigenId,
            "TRANSFERENCIA",
            clave,
            hashSolicitud
        );

        if (resultado.tipo === "REPETIDA") {
            return {
                repetida: true,
                respuesta: resultado.cuerpoRespuesta as T
            };
        }

        if (resultado.tipo === "CONFLICTO") {
            throw new BusinessRuleError(
                resultado.mensaje,
                "IDEMPOTENCIA_CONFLICTO"
            );
        }

        return {
            repetida: false
        };
    }

    protected async completarIdempotencia(
        repositorio: IIdempotenciaRepository,
        cuentaOrigenId: number,
        clave: string | undefined,
        respuesta: unknown
    ): Promise<void> {
        if (!clave) {
            return;
        }

        await repositorio.completar(
            cuentaOrigenId,
            "TRANSFERENCIA",
            clave,
            201,
            respuesta
        );
    }
}