import { IClienteRepository } from "../../../Application/Ports/IClienteRepository";
import { Cliente } from "../../../Domain/Entities/Cliente";
import { PostgresConnection } from "../PostgresConnection";
import { ClienteQueries } from "../Queries/ClienteQueries";
import { QueryExecutor } from "../QueryExecutor";

interface FilaCliente {
    id_cliente: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    fecha_registro: Date;
    activo: boolean;
}

export class ClienteRepositoryPostgres implements IClienteRepository {
    private readonly executor: QueryExecutor;

    constructor(executor: QueryExecutor = PostgresConnection.obtenerPool()) {
        this.executor = executor;
    }

    async buscarPorId(id: number): Promise<Cliente | null> {
        const resultado = await this.executor.query<FilaCliente>(
            ClienteQueries.BUSCAR_POR_ID,
            [id]
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        const fila = resultado.rows[0]!;
        return Cliente.reconstruir({
            id: fila.id_cliente,
            cedula: fila.cedula,
            nombres: fila.nombres,
            apellidos: fila.apellidos,
            telefono: fila.telefono,
            correo: fila.correo,
            direccion: fila.direccion,
            fechaRegistro: fila.fecha_registro,
            activo: fila.activo,
        });
    }
}
