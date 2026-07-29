import { OperacionRequestDto, OperacionResponseDto } from "../DTOs/OperacionDto";
import { TiposEvento } from "../Events/TiposEvento";
import { IUnidadDeTrabajo } from "../Ports/IUnidadDeTrabajo";
import { IdempotenciaService } from "./IdempotenciaService";
import { Movimiento } from "../../Domain/Entities/Movimiento";
import { Transaccion } from "../../Domain/Entities/Transaccion";
import { BusinessRuleError, CuentaNoEncontradaError } from "../../Domain/Errors/DomainErrors";
import { Dinero } from "../../Domain/ValueObjects/Dinero";
import { EventBus } from "../../Shared/Events/EventBus";
import { Evento } from "../../Shared/Events/Evento";

export class DepositoService {
    constructor(
        private readonly unidadDeTrabajo:
            IUnidadDeTrabajo,

        private readonly eventBus:
            EventBus,

        private readonly idempotenciaService:
            IdempotenciaService
    ) {}

    public async ejecutar(
        datos: OperacionRequestDto
    ): Promise<OperacionResponseDto> {
        const clave =
            this.idempotenciaService.normalizarClave(
                datos.idempotencyKey
            );

        const hashSolicitud =
            clave
                ? this.idempotenciaService.crearHash({
                    cuentaId: datos.cuentaId,
                    monto: datos.monto,
                    operacion: "DEPOSITO"
                })
                : undefined;

        let operacionNueva = true;

        const respuesta =
            await this.unidadDeTrabajo.ejecutar(
                async repositorios => {
                    if (
                        clave &&
                        hashSolicitud
                    ) {
                        const inicio =
                            await repositorios
                                .idempotencias
                                .iniciar(
                                    datos.cuentaId,
                                    "DEPOSITO",
                                    clave,
                                    hashSolicitud
                                );

                        if (
                            inicio.tipo ===
                            "REPETIDA"
                        ) {
                            operacionNueva = false;

                            return inicio
                                .cuerpoRespuesta as
                                OperacionResponseDto;
                        }

                        if (
                            inicio.tipo ===
                            "CONFLICTO"
                        ) {
                            throw new BusinessRuleError(
                                inicio.mensaje,
                                "IDEMPOTENCIA_CONFLICTO"
                            );
                        }
                    }

                    const cuenta =
                        await repositorios.cuentas
                            .buscarPorIdParaActualizar(
                                datos.cuentaId
                            );

                    if (!cuenta) {
                        throw new CuentaNoEncontradaError();
                    }

                    const monto =
                        Dinero.desde(datos.monto);

                    const resultado =
                        cuenta.depositar(monto);

                    const transaccion =
                        Transaccion.crear({
                            tipo: "DEPOSITO",
                            monto,
                            descripcion:
                                "Depósito en cuenta"
                        });

                    const transaccionId =
                        await repositorios
                            .transacciones
                            .crear(transaccion);

                    const movimiento =
                        Movimiento.crear({
                            naturaleza: "CREDITO",
                            monto,
                            saldoAnterior:
                                resultado.saldoAnterior,
                            saldoPosterior:
                                resultado.saldoNuevo,
                            idCuenta:
                                datos.cuentaId,
                            idTransaccion:
                                transaccionId
                        });

                    const movimientoId =
                        await repositorios
                            .movimientos
                            .crear(movimiento);

                    await repositorios.cuentas
                        .actualizar(cuenta);

                    const resultadoFinal:
                        OperacionResponseDto = {
                            saldoAnterior:
                                resultado
                                    .saldoAnterior
                                    .toNumber(),

                            saldoNuevo:
                                resultado
                                    .saldoNuevo
                                    .toNumber(),

                            transaccionId,
                            movimientoId
                        };

                    if (clave) {
                        await repositorios
                            .idempotencias
                            .completar(
                                datos.cuentaId,
                                "DEPOSITO",
                                clave,
                                201,
                                resultadoFinal
                            );
                    }

                    return resultadoFinal;
                }
            );

        if (operacionNueva) {
            this.eventBus.publicar(
                new Evento(
                    TiposEvento.DEPOSITO_REALIZADO,
                    {
                        ...respuesta,
                        monto: datos.monto,
                        cuentaId: datos.cuentaId,
                        correoCliente: datos.correoCliente
                    }
                )
            );
        }


        return respuesta;
    }
}