import { IMovimientoRepository } from "../../../Application/Ports/IMovimientoRepository";
import { Movimiento } from "../../../Domain/Entities/Movimiento";
import { NaturalezaMovimiento } from "../../../Domain/Enums/NaturalezaMovimiento";
import { Dinero } from "../../../Domain/ValueObjects/Dinero";
import { PostgresConnection } from "../PostgresConnection";
import { MovimientoQueries } from "../Queries/MovimientoQueries";
import { QueryExecutor } from "../QueryExecutor";

interface FilaMovimiento {
    id_movimiento: number;
    naturaleza: NaturalezaMovimiento;
    monto: string;
    saldo_anterior: string;
    saldo_posterior: string;
    fecha: Date;
    id_cuenta: number;
    id_transaccion: number;
}

export class MovimientoRepositoryPostgres
    implements IMovimientoRepository {
    private readonly executor: QueryExecutor;

    constructor(
        executor: QueryExecutor =
            PostgresConnection.obtenerPool()
    ) {
        this.executor = executor;
    }

    public async crear(
        movimiento: Movimiento
    ): Promise<number> {
        const resultado =
            await this.executor.query<{
                id_movimiento: number;
            }>(
                MovimientoQueries.CREAR,
                [
                    movimiento.obtenerNaturaleza(),
                    movimiento.obtenerMonto().toNumber(),
                    movimiento.obtenerSaldoAnterior().toNumber(),
                    movimiento.obtenerSaldoPosterior().toNumber(),
                    movimiento.obtenerFecha(),
                    movimiento.obtenerIdCuenta(),
                    movimiento.obtenerIdTransaccion()
                ]
            );

        return resultado.rows[0]!.id_movimiento;
    }

    public async buscarPorCuentaId(
        idCuenta: number,
        limite: number = 6,
        offset: number = 0
    ): Promise<Movimiento[]> {
        const resultado =
            await this.executor.query<FilaMovimiento>(
                MovimientoQueries.BUSCAR_POR_CUENTA_ID,
                [idCuenta, limite, offset]
            );

        return resultado.rows.map(
            fila => this.aEntidad(fila)
        );
    }

    public async buscarPorTransaccionId(
        idTransaccion: number
    ): Promise<Movimiento[]> {
        const resultado =
            await this.executor.query<FilaMovimiento>(
                MovimientoQueries.BUSCAR_POR_TRANSACCION_ID,
                [idTransaccion]
            );

        return resultado.rows.map(
            fila => this.aEntidad(fila)
        );
    }

    private aEntidad(
        fila: FilaMovimiento
    ): Movimiento {
        return Movimiento.reconstruir({
            id: fila.id_movimiento,
            naturaleza: fila.naturaleza,
            monto: Dinero.desde(Number(fila.monto)),
            saldoAnterior:
                Dinero.desde(Number(fila.saldo_anterior)),
            saldoPosterior:
                Dinero.desde(Number(fila.saldo_posterior)),
            fecha: new Date(fila.fecha),
            idCuenta: fila.id_cuenta,
            idTransaccion: fila.id_transaccion
        });
    }
}