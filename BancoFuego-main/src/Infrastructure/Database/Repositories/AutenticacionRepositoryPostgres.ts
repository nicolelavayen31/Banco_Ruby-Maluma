import { IAutenticacionRepository } from "../../../Application/Ports/IAutenticacionRepository";
import { Autenticacion } from "../../../Domain/Entities/Autenticacion";
import { PostgresConnection } from "../PostgresConnection";
import { AutenticacionQueries } from "../Queries/AutenticacionQueries";

interface FilaAutenticacion {
    id_autenticacion: number;
    pin: string;
    intentos: number;
    bloqueado: boolean;
    id_tarjeta: number;
}

export class AutenticacionRepositoryPostgres
    implements IAutenticacionRepository {

    private readonly pool =
        PostgresConnection.obtenerPool();

    public async buscarPorTarjetaId(
        idTarjeta: number
    ): Promise<Autenticacion | null> {
        const resultado =
            await this.pool.query<FilaAutenticacion>(
                AutenticacionQueries.BUSCAR_POR_TARJETA_ID,
                [idTarjeta]
            );

        const fila = resultado.rows[0];

        return fila
            ? this.aEntidad(fila)
            : null;
    }

    public async crear(
        autenticacion: Autenticacion
    ): Promise<number> {
        const resultado =
            await this.pool.query<{
                id_autenticacion: number;
            }>(
                AutenticacionQueries.CREAR,
                [
                    autenticacion.obtenerPinHash(),
                    autenticacion.obtenerIntentos(),
                    autenticacion.estaBloqueado(),
                    autenticacion.obtenerIdTarjeta()
                ]
            );

        return resultado.rows[0]!.id_autenticacion;
    }

    public async actualizar(
        autenticacion: Autenticacion
    ): Promise<void> {
        const id = autenticacion.obtenerId();

        if (id === undefined) {
            throw new Error(
                "No se puede actualizar una autenticación sin id"
            );
        }

        await this.pool.query(
            AutenticacionQueries.ACTUALIZAR,
            [
                autenticacion.obtenerPinHash(),
                autenticacion.obtenerIntentos(),
                autenticacion.estaBloqueado(),
                id
            ]
        );
    }

    private aEntidad(
        fila: FilaAutenticacion
    ): Autenticacion {
        return Autenticacion.reconstruir({
            id: fila.id_autenticacion,
            pinHash: fila.pin,
            intentos: fila.intentos,
            bloqueado: fila.bloqueado,
            idTarjeta: fila.id_tarjeta
        });
    }
}