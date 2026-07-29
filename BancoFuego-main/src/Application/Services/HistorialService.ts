import { HistorialItemDto } from "../DTOs/HistorialDto";
import { IMovimientoRepository } from "../Ports/IMovimientoRepository";
import { ITransaccionRepository } from "../Ports/ITransaccionRepository";
import { Transaccion } from "../../Domain/Entities/Transaccion";

export class HistorialService {
    constructor(
        private readonly movimientoRepository:
            IMovimientoRepository,

        private readonly transaccionRepository:
            ITransaccionRepository
    ) { }

    public async obtenerPorCuenta(
        cuentaId: number,
        limite: number = 6,
        offset: number = 0
    ): Promise<HistorialItemDto[]> {
        const movimientos =
            await this.movimientoRepository
                .buscarPorCuentaId(cuentaId, limite, offset);

        const transaccionIds = [
            ...new Set(
                movimientos.map(
                    movimiento =>
                        movimiento
                            .obtenerIdTransaccion()
                )
            )
        ];

        const transacciones =
            await this.transaccionRepository
                .buscarTodosPorIds(
                    transaccionIds
                );

        const transaccionesPorId =
            new Map<number, Transaccion>();

        for (
            const transaccion
            of transacciones
        ) {
            const id =
                transaccion.obtenerId();

            if (id !== undefined) {
                transaccionesPorId.set(
                    id,
                    transaccion
                );
            }
        }

        const historial:
            HistorialItemDto[] = [];

        for (
            const movimiento
            of movimientos
        ) {
            const movimientoId =
                movimiento.obtenerId();

            const transaccionId =
                movimiento
                    .obtenerIdTransaccion();

            const transaccion =
                transaccionesPorId.get(
                    transaccionId
                );

            if (
                movimientoId === undefined ||
                !transaccion
            ) {
                continue;
            }

            historial.push({
                movimientoId,
                transaccionId,

                tipo:
                    transaccion.obtenerTipo(),

                monto:
                    movimiento
                        .obtenerMonto()
                        .toNumber(),

                estado:
                    transaccion.obtenerEstado(),

                fecha:
                    movimiento.obtenerFecha(),

                naturaleza:
                    movimiento
                        .obtenerNaturaleza(),

                saldoAnterior:
                    movimiento
                        .obtenerSaldoAnterior()
                        .toNumber(),

                saldoPosterior:
                    movimiento
                        .obtenerSaldoPosterior()
                        .toNumber(),

            });
        }

        return historial;
    }
}