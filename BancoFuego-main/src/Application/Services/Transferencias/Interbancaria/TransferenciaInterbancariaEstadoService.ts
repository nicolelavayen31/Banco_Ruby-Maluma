import {
    ConsultaTransferenciaInterbancariaResponseDto
} from "../../../DTOs/Transferencias/Interbancaria/TransferenciaInterbancariaDto";

import {
    IRedBancariaClient
} from "../../../Ports/Transferencias/Interbancaria/IRedBancariaClient";

import {
    IUnidadDeTrabajo
} from "../../../Ports/IUnidadDeTrabajo";

import {
    Transaccion
} from "../../../../Domain/Entities/Transaccion";

import {
    BusinessRuleError
} from "../../../../Domain/Errors/DomainErrors";

import {
    TiposEvento
} from "../../../Events/TiposEvento";

import {
    EventBus
} from "../../../../Shared/Events/EventBus";

import {
    Evento
} from "../../../../Shared/Events/Evento";

import logger from "../../../../Shared/Logging/Logger";

import {
    AplicarResultadoInterbancarioService
} from "./AplicarResultadoInterbancarioService";

export class TransferenciaInterbancariaEstadoService {
    constructor(
        private readonly unidadDeTrabajo:
            IUnidadDeTrabajo,

        private readonly redBancariaClient:
            IRedBancariaClient,

        private readonly eventBus:
            EventBus,

        private readonly aplicarResultadoService:
            AplicarResultadoInterbancarioService
    ) { }

    public async consultarPorId(
        transaccionId: number
    ): Promise<ConsultaTransferenciaInterbancariaResponseDto> {
        this.validarTransaccionId(
            transaccionId
        );

        const transaccion =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios =>
                    repositorios.transacciones
                        .buscarPorId(
                            transaccionId
                        )
            );

        if (!transaccion) {
            throw new BusinessRuleError(
                "La transferencia no fue encontrada.",
                "TRANSFERENCIA_NO_ENCONTRADA"
            );
        }

        this.validarInterbancaria(
            transaccion
        );

        if (transaccion.esPendiente()) {
            const referenciaExterna =
                this.extraerReferencia(
                    transaccion
                );

            return this.sincronizarTransaccion(
                transaccionId,
                referenciaExterna
            );
        }

        return this.aplicarResultadoService
            .aRespuesta(
                transaccion
            );
    }

    public async sincronizarPendientes(
        limite: number = 50
    ): Promise<number> {
        const pendientes =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios =>
                    repositorios.transacciones
                        .buscarPendientesInterbancarias(
                            limite
                        )
            );

        const ids = pendientes
            .map(
                transaccion =>
                    transaccion.obtenerId()
            )
            .filter(
                (id): id is number =>
                    id !== undefined
            );

        return this.procesarEnLotes(
            ids,
            5
        );
    }

    private async procesarEnLotes(
        transaccionIds: number[],
        tamanioLote: number
    ): Promise<number> {
        let actualizadas = 0;

        for (
            let indice = 0;
            indice < transaccionIds.length;
            indice += tamanioLote
        ) {
            const lote =
                transaccionIds.slice(
                    indice,
                    indice + tamanioLote
                );

            const resultados =
                await Promise.all(
                    lote.map(
                        transaccionId =>
                            this.sincronizarPendiente(
                                transaccionId
                            )
                    )
                );

            actualizadas += resultados.filter(
                actualizada =>
                    actualizada
            ).length;
        }

        return actualizadas;
    }

    private async sincronizarPendiente(
        transaccionId: number
    ): Promise<boolean> {
        try {
            const resultado =
                await this.sincronizarTransaccion(
                    transaccionId
                );

            return resultado.estado !== "PENDIENTE";
        } catch (error) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : String(error);

            logger.warn(
                `No se pudo sincronizar la transferencia ${transaccionId}: ${mensaje}`
            );

            return false;
        }
    }

    private async sincronizarTransaccion(
        transaccionId: number,
        referenciaExistente?: string
    ): Promise<ConsultaTransferenciaInterbancariaResponseDto> {
        const referenciaExterna =
            referenciaExistente ??
            await this.obtenerReferencia(
                transaccionId
            );

        const resultadoExterno =
            await this.redBancariaClient
                .consultarEstado(
                    referenciaExterna
                );

        const resultado =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios => {
                    const transaccion =
                        await repositorios
                            .transacciones
                            .buscarPorIdParaActualizar(
                                transaccionId
                            );

                    if (!transaccion) {
                        throw new BusinessRuleError(
                            "La transferencia no fue encontrada.",
                            "TRANSFERENCIA_NO_ENCONTRADA"
                        );
                    }

                    this.validarInterbancaria(
                        transaccion
                    );

                    if (!transaccion.esPendiente()) {
                        return {
                            respuesta:
                                this.aplicarResultadoService
                                    .aRespuesta(
                                        transaccion
                                    ),

                            cambioEstado: false,
                            reversaAplicada: false
                        };
                    }

                    return this.aplicarResultadoService
                        .aplicar(
                            transaccion,
                            resultadoExterno,
                            repositorios
                        );
                }
            );

        if (resultado.cambioEstado) {
            this.publicarCambioEstado(
                resultado.respuesta,
                resultado.reversaAplicada
            );
        }

        return resultado.respuesta;
    }

    private async obtenerReferencia(
        transaccionId: number
    ): Promise<string> {
        const transaccion =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios =>
                    repositorios.transacciones
                        .buscarPorId(
                            transaccionId
                        )
            );

        if (!transaccion) {
            throw new BusinessRuleError(
                "La transferencia no fue encontrada.",
                "TRANSFERENCIA_NO_ENCONTRADA"
            );
        }

        this.validarInterbancaria(
            transaccion
        );

        return this.extraerReferencia(
            transaccion
        );
    }

    private extraerReferencia(
        transaccion: Transaccion
    ): string {
        const referencia =
            transaccion.obtenerReferenciaExterna();

        if (!referencia) {
            throw new BusinessRuleError(
                "La transferencia no tiene referencia externa.",
                "REFERENCIA_EXTERNA_NO_ENCONTRADA"
            );
        }

        return referencia;
    }

    private validarTransaccionId(
        transaccionId: number
    ): void {
        if (
            !Number.isInteger(
                transaccionId
            ) ||
            transaccionId <= 0
        ) {
            throw new BusinessRuleError(
                "El ID de la transacción no es válido.",
                "TRANSACCION_ID_INVALIDO"
            );
        }
    }

    private validarInterbancaria(
        transaccion: Transaccion
    ): void {
        if (
            transaccion.obtenerTipo() !==
            "TRANSFERENCIA_EXTERNA"
        ) {
            throw new BusinessRuleError(
                "La transacción no corresponde a una transferencia interbancaria.",
                "TRANSACCION_NO_INTERBANCARIA"
            );
        }
    }

    private publicarCambioEstado(
        respuesta:
            ConsultaTransferenciaInterbancariaResponseDto,

        reversaAplicada:
            boolean
    ): void {
        this.eventBus.publicar(
            new Evento(
                TiposEvento.TRANSFERENCIA_REALIZADA,
                {
                    canal: "INTERBANCARIA",

                    transaccionId:
                        respuesta.transaccionId,

                    referenciaExterna:
                        respuesta.referenciaExterna,

                    estado:
                        respuesta.estado,

                    reversaAplicada,

                    actualizadoEn:
                        respuesta.actualizadoEn
                }
            )
        );
    }
}