import {
    TransferenciaLocalRequestDto,
    TransferenciaLocalResponseDto
} from "../../../DTOs/Transferencias/Local/TransferenciaLocalDto";

import { IUnidadDeTrabajo } from "../../../Ports/IUnidadDeTrabajo";

import { IdempotenciaService } from "../../IdempotenciaService";
import { TransferenciaBaseService } from "../TransferenciaBaseService";

import { Movimiento } from "../../../../Domain/Entities/Movimiento";
import { Transaccion } from "../../../../Domain/Entities/Transaccion";

import {
    BusinessRuleError,
    CuentaNoEncontradaError
} from "../../../../Domain/Errors/DomainErrors";

import { Dinero } from "../../../../Domain/ValueObjects/Dinero";

export interface ResultadoTransferenciaLocal {
    respuesta: TransferenciaLocalResponseDto;
    operacionNueva: boolean;
}

export class TransferenciaLocalService
    extends TransferenciaBaseService
{
    constructor(
        private readonly unidadDeTrabajo: IUnidadDeTrabajo,
        private readonly idempotenciaService: IdempotenciaService
    ) {
        super();
    }

    public async ejecutar(
        datos: TransferenciaLocalRequestDto
    ): Promise<ResultadoTransferenciaLocal> {
        if (datos.cuentaOrigenId === datos.cuentaDestinoId) {
            throw new BusinessRuleError(
                "La cuenta origen y destino no pueden ser la misma.",
                "MISMA_CUENTA_TRANSFERENCIA"
            );
        }

        const monto =
            Dinero.desde(datos.monto);

        const clave =
            this.idempotenciaService.normalizarClave(
                datos.idempotencyKey
            );

        const hashSolicitud =
            clave
                ? this.idempotenciaService.crearHash({
                      tipoTransferencia: "LOCAL",
                      cuentaOrigenId: datos.cuentaOrigenId,
                      cuentaDestinoId: datos.cuentaDestinoId,
                      monto: datos.monto,
                      operacion: "TRANSFERENCIA"
                  })
                : undefined;

        return this.unidadDeTrabajo.ejecutar(
            async repositorios => {
                const idempotencia =
                    await this.comprobarIdempotencia<
                        TransferenciaLocalResponseDto
                    >(
                        repositorios.idempotencias,
                        datos.cuentaOrigenId,
                        clave,
                        hashSolicitud
                    );

                if (
                    idempotencia.repetida &&
                    idempotencia.respuesta
                ) {
                    return {
                        respuesta: idempotencia.respuesta,
                        operacionNueva: false
                    };
                }

                const [primerId, segundoId] = [
                    datos.cuentaOrigenId,
                    datos.cuentaDestinoId
                ].sort((a, b) => a - b);

                const primeraCuenta =
                    await repositorios.cuentas
                        .buscarPorIdParaActualizar(primerId);

                const segundaCuenta =
                    await repositorios.cuentas
                        .buscarPorIdParaActualizar(segundoId);

                const cuentaOrigen =
                    primerId === datos.cuentaOrigenId
                        ? primeraCuenta
                        : segundaCuenta;

                const cuentaDestino =
                    primerId === datos.cuentaDestinoId
                        ? primeraCuenta
                        : segundaCuenta;

                if (!cuentaOrigen || !cuentaDestino) {
                    throw new CuentaNoEncontradaError(
                        "No se encontró la cuenta origen o destino."
                    );
                }

                const retiro =
                    cuentaOrigen.retirar(monto);

                const deposito =
                    cuentaDestino.depositar(monto);

                const transaccion =
                    Transaccion.crear({
                        tipo: "TRANSFERENCIA_INTERNA",
                        monto,
                        descripcion: "Transferencia local"
                    });

                const transaccionId =
                    await repositorios.transacciones.crear(
                        transaccion
                    );

                const movimientoOrigen =
                    Movimiento.debito({
                        monto,
                        saldoAnterior:
                            retiro.saldoAnterior,
                        saldoPosterior:
                            retiro.saldoNuevo,
                        idCuenta:
                            datos.cuentaOrigenId,
                        idTransaccion:
                            transaccionId
                    });

                const movimientoDestino =
                    Movimiento.credito({
                        monto,
                        saldoAnterior:
                            deposito.saldoAnterior,
                        saldoPosterior:
                            deposito.saldoNuevo,
                        idCuenta:
                            datos.cuentaDestinoId,
                        idTransaccion:
                            transaccionId
                    });

                await repositorios.movimientos.crear(
                    movimientoOrigen
                );

                await repositorios.movimientos.crear(
                    movimientoDestino
                );

                await repositorios.cuentas.actualizar(
                    cuentaOrigen
                );

                await repositorios.cuentas.actualizar(
                    cuentaDestino
                );

                const respuesta:
                    TransferenciaLocalResponseDto = {
                        tipo: "TRANSFERENCIA_INTERNA",

                        origen: {
                            cuentaId:
                                datos.cuentaOrigenId,
                            saldoAnterior:
                                retiro.saldoAnterior.toNumber(),
                            saldoNuevo:
                                retiro.saldoNuevo.toNumber()
                        },

                        destino: {
                            cuentaId:
                                datos.cuentaDestinoId,
                            saldoAnterior:
                                deposito.saldoAnterior.toNumber(),
                            saldoNuevo:
                                deposito.saldoNuevo.toNumber()
                        },

                        transaccionId
                    };

                await this.completarIdempotencia(
                    repositorios.idempotencias,
                    datos.cuentaOrigenId,
                    clave,
                    respuesta
                );

                return {
                    respuesta,
                    operacionNueva: true
                };
            }
        );
    }
}