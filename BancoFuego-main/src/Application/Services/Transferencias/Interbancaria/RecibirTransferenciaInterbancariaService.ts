// Application/Services/Transferencias/Interbancaria/RecibirTransferenciaInterbancariaService.ts

import { Movimiento } from "../../../../Domain/Entities/Movimiento";
import { Transaccion } from "../../../../Domain/Entities/Transaccion";
import { Dinero } from "../../../../Domain/ValueObjects/Dinero";
import { RecibirTransferenciaInterbancariaRequestDto, RecibirTransferenciaInterbancariaResponseDto } from "../../../DTOs/Transferencias/Interbancaria/RecibirTransferenciaInterbancaria";
import { IUnidadDeTrabajo } from "../../../Ports/IUnidadDeTrabajo";

export class RecibirTransferenciaInterbancariaService {
    constructor(
        private readonly unidadDeTrabajo: IUnidadDeTrabajo
    ) { }

    public async recibir(
        datos: RecibirTransferenciaInterbancariaRequestDto
    ): Promise<RecibirTransferenciaInterbancariaResponseDto> {
        const monto = Dinero.desde(datos.monto);

        return this.unidadDeTrabajo.ejecutar(async repositorios => {
            // 1. Idempotencia: ¿ya procesamos esta referencia antes?
            const existente =
                await repositorios.transacciones
                    .buscarPorReferenciaExternaParaActualizar(
                        datos.referenciaExterna
                    );

            if (existente) {
                return {
                    estado: "ACEPTADA",
                    referenciaExterna: datos.referenciaExterna,
                    transaccionId: existente.obtenerId(),
                    mensaje: "Operación ya procesada previamente."
                };
            }

            // 2. Resolver cuenta destino (con bloqueo, evita carreras)
            const cuentaDestino =
                await repositorios.cuentas
                    .buscarPorNumeroCuentaParaActualizar(
                        datos.numeroCuentaDestino
                    );

            if (!cuentaDestino) {
                return {
                    estado: "RECHAZADA",
                    referenciaExterna: datos.referenciaExterna,
                    codigoError: "CUENTA_DESTINO_NO_EXISTE",
                    mensaje: "La cuenta destino no existe en este banco."
                };
            }

            // 3. Acreditar (Cuenta.depositar ya valida activa/monto > 0)
            let credito;
            try {
                credito = cuentaDestino.depositar(monto);
            } catch (error) {
                return {
                    estado: "RECHAZADA",
                    referenciaExterna: datos.referenciaExterna,
                    codigoError: "CUENTA_NO_PUEDE_RECIBIR",
                    mensaje:
                        error instanceof Error
                            ? error.message
                            : "No se pudo acreditar la cuenta destino."
                };
            }

            // 4. Registrar transacción como EXITOSA (ya se resolvió en el momento)
            const transaccion = Transaccion.crear({
                tipo: "TRANSFERENCIA_ENTRANTE",
                monto,
                estado: "EXITOSA",
                descripcion:
                    datos.concepto ??
                    `Transferencia recibida de ${datos.bancoOrigen}`,
                referenciaExterna: datos.referenciaExterna
            });

            const transaccionId =
                await repositorios.transacciones.crear(transaccion);

            // 5. Movimiento de crédito
            const movimiento = Movimiento.credito({
                monto,
                saldoAnterior: credito.saldoAnterior,
                saldoPosterior: credito.saldoNuevo,
                idCuenta: cuentaDestino.obtenerId()!,
                idTransaccion: transaccionId
            });

            await repositorios.movimientos.crear(movimiento);
            await repositorios.cuentas.actualizar(cuentaDestino);

            return {
                estado: "ACEPTADA",
                referenciaExterna: datos.referenciaExterna,
                transaccionId
            };
        });
    }
}