import { ITransaccionRepository } from "../../../Application/Ports/ITransaccionRepository";
import { Transaccion } from "../../../Domain/Entities/Transaccion";
import { EstadoTransaccion } from "../../../Domain/Enums/EstadoTransaccion";
import { TipoTransaccion } from "../../../Domain/Enums/TipoTransaccion";
import { Dinero } from "../../../Domain/ValueObjects/Dinero";
import { PostgresConnection } from "../PostgresConnection";
import { TransaccionQueries } from "../Queries/TransaccionQueries";
import { QueryExecutor } from "../QueryExecutor";

interface FilaTransaccion {
    id_transaccion: number;
    tipo: TipoTransaccion;
    monto: string;
    estado: EstadoTransaccion;
    fecha: Date;
    descripcion: string | null;
    id_cajero: number | null;
    referencia_externa: string | null;
    estado_detalle: string | null;
    updated_at: Date | null;
}

export class TransaccionRepositoryPostgres
    implements ITransaccionRepository {
    private readonly executor: QueryExecutor;

    constructor(
        executor: QueryExecutor =
            PostgresConnection.obtenerPool()
    ) {
        this.executor = executor;
    }

    public async crear(
        transaccion: Transaccion
    ): Promise<number> {
        const resultado =
            await this.executor.query<{
                id_transaccion: number;
            }>(
                TransaccionQueries.CREAR,
                [
                    transaccion.obtenerTipo(),
                    transaccion.obtenerMonto().toNumber(),
                    transaccion.obtenerEstado(),
                    transaccion.obtenerFecha(),
                    transaccion.obtenerDescripcion() ?? null,
                    transaccion.obtenerIdCajero() ?? null,
                    transaccion.obtenerReferenciaExterna() ?? null,
                    transaccion.obtenerEstadoDetalle() ?? null,
                    transaccion.obtenerActualizadoEn()
                ]
            );

        return resultado.rows[0]!.id_transaccion;
    }

    public async actualizar(
        transaccion: Transaccion
    ): Promise<void> {
        const id = transaccion.obtenerId();

        if (id === undefined) {
            throw new Error(
                "No se puede actualizar una transacción sin ID."
            );
        }

        await this.executor.query(
            TransaccionQueries.ACTUALIZAR,
            [
                transaccion.obtenerEstado(),
                transaccion.obtenerReferenciaExterna() ?? null,
                transaccion.obtenerEstadoDetalle() ?? null,
                transaccion.obtenerActualizadoEn(),
                id
            ]
        );
    }

    public async buscarPorId(
        id: number
    ): Promise<Transaccion | null> {
        const resultado =
            await this.executor.query<FilaTransaccion>(
                TransaccionQueries.BUSCAR_POR_ID,
                [id]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }

    public async buscarPorIdParaActualizar(
        id: number
    ): Promise<Transaccion | null> {
        const resultado =
            await this.executor.query<FilaTransaccion>(
                TransaccionQueries.BUSCAR_POR_ID_PARA_ACTUALIZAR,
                [id]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }

    public async buscarTodosPorIds(
        ids: number[]
    ): Promise<Transaccion[]> {
        if (ids.length === 0) {
            return [];
        }

        const resultado =
            await this.executor.query<FilaTransaccion>(
                TransaccionQueries.BUSCAR_TODAS_POR_IDS,
                [ids]
            );

        return resultado.rows.map(
            fila => this.aEntidad(fila)
        );
    }

    public async buscarPendientesInterbancarias(
        limite: number = 50
    ): Promise<Transaccion[]> {
        const limiteSeguro =
            Number.isInteger(limite) && limite > 0
                ? Math.min(limite, 200)
                : 50;

        const resultado =
            await this.executor.query<FilaTransaccion>(
                TransaccionQueries
                    .BUSCAR_PENDIENTES_INTERBANCARIAS,
                [limiteSeguro]
            );

        return resultado.rows.map(
            fila => this.aEntidad(fila)
        );
    }

    private aEntidad(
        fila: FilaTransaccion
    ): Transaccion {
        return Transaccion.reconstruir({
            id: fila.id_transaccion,
            tipo: fila.tipo,
            monto: Dinero.desde(Number(fila.monto)),
            estado: fila.estado,
            fecha: new Date(fila.fecha),
            descripcion:
                fila.descripcion ?? undefined,
            idCajero:
                fila.id_cajero ?? undefined,
            referenciaExterna:
                fila.referencia_externa ?? undefined,
            estadoDetalle:
                fila.estado_detalle ?? undefined,
            actualizadoEn:
                fila.updated_at
                    ? new Date(fila.updated_at)
                    : new Date(fila.fecha)
        });
    }

    public async buscarPorReferenciaExternaParaActualizar(referenciaExterna: string):
        Promise<Transaccion | null> {
        const resultado =
            await this.executor.query<FilaTransaccion>(
                TransaccionQueries
                    .BUSCAR_POR_REFERENCIA_EXTERNA_PARA_ACTUALIZAR,
                [referenciaExterna]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }
}