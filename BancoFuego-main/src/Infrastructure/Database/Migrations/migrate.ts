import { PostgresConnection } from "../PostgresConnection";
import { MigrationRunner } from "./MigrationRunner";

async function ejecutarMigraciones():
    Promise<void> {
    try {
        await PostgresConnection
            .verificarConexion();

        console.log(
            "Conexión con PostgreSQL verificada"
        );

        const runner =
            new MigrationRunner();

        await runner.ejecutar();

        console.log(
            "Todas las migraciones pendientes fueron completadas"
        );
    } catch (error) {
        const mensaje =
            error instanceof Error
                ? error.message
                : "Error desconocido";

        console.error(
            `No fue posible ejecutar las migraciones: ${mensaje}`
        );

        process.exitCode = 1;
    } finally {
        await PostgresConnection
            .cerrarConexion();
    }
}

void ejecutarMigraciones();