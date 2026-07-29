import { IIdempotenciaRepository, ResultadoInicioIdempotencia, TipoOperacionIdempotente } from "../../../Application/Ports/IIdempotenciaRepository";
import { PostgresConnection } from "../PostgresConnection";
import { QueryExecutor } from "../QueryExecutor";
import { IdempotenciaQueries } from "../Queries/IdempotenciaQueries";

interface FilaIdempotencia {
    id_cuenta: number;
    operacion: TipoOperacionIdempotente;
    idempotency_key: string;
    request_hash: string;
    estado:
        | "EN_PROCESO"
        | "COMPLETADA";
    respuesta_http: number | null;
    respuesta_body: unknown | null;
}

interface FilaIdempotenciaCreada {
    id_idempotencia: number;
}

export class IdempotenciaRepositoryPostgres
    implements IIdempotenciaRepository {

    constructor(
        private readonly executor:
            QueryExecutor = PostgresConnection.obtenerPool()
    ) {}

    public async iniciar(
        cuentaId: number,
        operacion: TipoOperacionIdempotente,
        clave: string,
        hashSolicitud: string
    ): Promise<ResultadoInicioIdempotencia> {
        const insercion =
            await this.executor
                .query<FilaIdempotenciaCreada>(
                    IdempotenciaQueries
                        .CREAR_SI_NO_EXISTE,
                    [
                        cuentaId,
                        operacion,
                        clave,
                        hashSolicitud
                    ]
                );

        if (insercion.rowCount === 1) {
            return {
                tipo: "NUEVA"
            };
        }

        const resultado =
            await this.executor
                .query<FilaIdempotencia>(
                    IdempotenciaQueries
                        .BUSCAR_Y_BLOQUEAR,
                    [
                        cuentaId,
                        operacion,
                        clave
                    ]
                );

        const fila =
            resultado.rows[0];

        if (!fila) {
            return {
                tipo: "CONFLICTO",
                mensaje:
                    "No fue posible inicializar la clave de idempotencia"
            };
        }

        if (
            fila.request_hash !==
            hashSolicitud
        ) {
            return {
                tipo: "CONFLICTO",
                mensaje:
                    "La misma clave de idempotencia no puede utilizarse con datos diferentes"
            };
        }

        if (
            fila.estado === "COMPLETADA" &&
            fila.respuesta_http !== null &&
            fila.respuesta_body !== null
        ) {
            return {
                tipo: "REPETIDA",
                codigoRespuesta:
                    fila.respuesta_http,
                cuerpoRespuesta:
                    fila.respuesta_body
            };
        }

        return {
            tipo: "CONFLICTO",
            mensaje:
                "Ya existe una solicitud en progreso con esta clave de idempotencia"
        };
    }

    public async completar(
        cuentaId: number,
        operacion: TipoOperacionIdempotente,
        clave: string,
        codigoRespuesta: number,
        cuerpoRespuesta: unknown
    ): Promise<void> {
        await this.executor.query(
            IdempotenciaQueries.COMPLETAR,
            [
                cuentaId,
                operacion,
                clave,
                codigoRespuesta,
                JSON.stringify(
                    cuerpoRespuesta
                )
            ]
        );
    }
}