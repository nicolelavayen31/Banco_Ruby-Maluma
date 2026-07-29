import { ITarjetaRepository } from "../../../Application/Ports/ITarjetaRepository";
import { Tarjeta } from "../../../Domain/Entities/Tarjeta";
import { NumeroTarjeta } from "../../../Domain/ValueObjects/NumeroTarjeta";
import { PostgresConnection } from "../PostgresConnection";
import { TarjetaQueries } from "../Queries/TarjetaQueries";

interface FilaTarjeta {
    id_tarjeta: number;
    numero_tarjeta: string;
    fecha_vencimiento: Date;
    cvv: string;
    activa: boolean;
    id_cuenta: number;
}

export class TarjetaRepositoryPostgres
    implements ITarjetaRepository {

    private readonly pool =
        PostgresConnection.obtenerPool();

    public async buscarPorNumero(
        numeroTarjeta: NumeroTarjeta
    ): Promise<Tarjeta | null> {
        const resultado =
            await this.pool.query<FilaTarjeta>(
                TarjetaQueries.BUSCAR_POR_NUMERO,
                [numeroTarjeta.valorCompleto()]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }

    public async buscarPorId(
        id: number
    ): Promise<Tarjeta | null> {
        const resultado =
            await this.pool.query<FilaTarjeta>(
                TarjetaQueries.BUSCAR_POR_ID,
                [id]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }

    public async crear(
        tarjeta: Tarjeta
    ): Promise<number> {
        const resultado =
            await this.pool.query<{
                id_tarjeta: number;
            }>(
                TarjetaQueries.CREAR,
                [
                    tarjeta
                        .obtenerNumeroTarjeta()
                        .valorCompleto(),

                    tarjeta.obtenerFechaVencimiento(),
                    tarjeta.obtenerCvv(),
                    tarjeta.estaActiva(),
                    tarjeta.obtenerIdCuenta()
                ]
            );

        return resultado.rows[0]!.id_tarjeta;
    }

    public async actualizar(
        tarjeta: Tarjeta
    ): Promise<void> {
        const id = tarjeta.obtenerId();

        if (id === undefined) {
            throw new Error(
                "No se puede actualizar una tarjeta sin id"
            );
        }

        await this.pool.query(
            TarjetaQueries.ACTUALIZAR,
            [
                tarjeta.estaActiva(),
                id
            ]
        );
    }

    private aEntidad(
        fila: FilaTarjeta
    ): Tarjeta {
        return Tarjeta.reconstruir({
            id: fila.id_tarjeta,

            numeroTarjeta:
                NumeroTarjeta.desde(
                    fila.numero_tarjeta
                ),

            fechaVencimiento:
                new Date(fila.fecha_vencimiento),

            cvv:
                fila.cvv,

            activa:
                fila.activa,

            idCuenta:
                fila.id_cuenta
        });
    }
}