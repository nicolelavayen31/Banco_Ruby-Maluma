import { RespuestaCallbackInterbancarioRequestDto } from "../../../DTOs/Transferencias/Interbancaria/RespuestaCallbackInterbancarioDto";
import { IUnidadDeTrabajo } from "../../../Ports/IUnidadDeTrabajo";
import { BusinessRuleError } from "../../../../Domain/Errors/DomainErrors";
import { TiposEvento } from "../../../Events/TiposEvento";
import { EventBus } from "../../../../Shared/Events/EventBus";
import { Evento } from "../../../../Shared/Events/Evento";

import { AplicarResultadoInterbancarioService } from "./AplicarResultadoInterbancarioService";

export class ProcesarRespuestaInterbancariaService {
    constructor(
        private readonly unidadDeTrabajo:
            IUnidadDeTrabajo,

        private readonly eventBus:
            EventBus,

        private readonly aplicarResultadoService:
            AplicarResultadoInterbancarioService
    ) { }

    public async procesar(
        datos: RespuestaCallbackInterbancarioRequestDto
    ): Promise<void> {
        const resultado =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios => {
                    const transaccion =
                        await repositorios.transacciones
                            .buscarPorReferenciaExternaParaActualizar(
                                datos.referenciaExterna
                            );

                    if (!transaccion) {
                        throw new BusinessRuleError(
                            "No existe una transferencia con esa referencia externa.",
                            "TRANSFERENCIA_NO_ENCONTRADA"
                        );
                    }

                    if (!transaccion.esPendiente()) {
                        // Idempotencia: si ya se resolvió antes (por polling
                        // o por un callback duplicado), no volvemos a aplicar nada.
                        return {
                            respuesta:
                                this.aplicarResultadoService
                                    .aRespuesta(transaccion),
                            cambioEstado: false,
                            reversaAplicada: false
                        };
                    }

                    return this.aplicarResultadoService.aplicar(
                        transaccion,
                        datos.estado === "ACEPTADA"
                            ? {
                                estado: "ACEPTADA",
                                referenciaExterna: datos.referenciaExterna,
                                mensaje: datos.mensaje
                            }
                            : {
                                estado: "RECHAZADA",
                                codigoError: datos.codigoError!,
                                mensaje: datos.mensaje
                            },
                        repositorios
                    );
                }
            );

        if (resultado.cambioEstado) {
            this.eventBus.publicar(
                new Evento(
                    TiposEvento.TRANSFERENCIA_REALIZADA,
                    {
                        canal: "INTERBANCARIA",
                        transaccionId: resultado.respuesta.transaccionId,
                        referenciaExterna: resultado.respuesta.referenciaExterna,
                        estado: resultado.respuesta.estado,
                        reversaAplicada: resultado.reversaAplicada,
                        actualizadoEn: resultado.respuesta.actualizadoEn
                    }
                )
            );
        }
    }
}