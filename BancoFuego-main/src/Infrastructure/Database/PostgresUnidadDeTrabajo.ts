import { IUnidadDeTrabajo, RepositoriosTransaccionales } from "../../Application/Ports/IUnidadDeTrabajo";
import { PostgresConnection } from "./PostgresConnection";
import { CuentaRepositoryPostgres } from "./Repositories/CuentaRepositoryPostgres";
import { IdempotenciaRepositoryPostgres } from "./Repositories/IdempotenciaRepositoryPostgres";
import { MovimientoRepositoryPostgres } from "./Repositories/MovimientoRepositoryPostgres";
import { TransaccionRepositoryPostgres } from "./Repositories/TransaccionRepositoryPostgres";

export class PostgresUnidadDeTrabajo
    implements IUnidadDeTrabajo {

    public async ejecutar<T>(
        operacion: (
            repositorios:
                RepositoriosTransaccionales
        ) => Promise<T>
    ): Promise<T> {
        const pool =
            PostgresConnection.obtenerPool();

        const cliente =
            await pool.connect();

        try {
            await cliente.query(
                "BEGIN"
            );

            const repositorios:
                RepositoriosTransaccionales = {
                    cuentas:
                        new CuentaRepositoryPostgres(
                            cliente
                        ),

                    movimientos:
                        new MovimientoRepositoryPostgres(
                            cliente
                        ),

                    transacciones:
                        new TransaccionRepositoryPostgres(
                            cliente
                        ),

                    idempotencias:
                        new IdempotenciaRepositoryPostgres(
                            cliente
                        )
                };

            const resultado =
                await operacion(
                    repositorios
                );

            await cliente.query(
                "COMMIT"
            );

            return resultado;
        } catch (error) {
            try {
                await cliente.query(
                    "ROLLBACK"
                );
            } catch {
                // Conservamos el error original.
            }

            throw error;
        } finally {
            cliente.release();
        }
    }
}