import dotenv from "dotenv";
import { Pool, PoolConfig } from "pg";

dotenv.config();

export class PostgresConnection {
    private static pool: Pool | undefined;

    public static obtenerPool(): Pool {
        if (!this.pool) {
            this.pool =
                new Pool(
                    this.obtenerConfiguracion()
                );

            this.registrarEventos(
                this.pool
            );
        }

        return this.pool;
    }

    public static async verificarConexion():
        Promise<void> {
        const pool =
            this.obtenerPool();

        await pool.query(
            "SELECT 1"
        );
    }

    public static async cerrarConexion():
        Promise<void> {
        if (!this.pool) {
            return;
        }

        await this.pool.end();

        this.pool = undefined;
    }

    private static obtenerConfiguracion():
        PoolConfig {
        return {
            host:
                process.env.DB_HOST ??
                "localhost",

            port:
                this.obtenerPuerto(),

            database:
                process.env.DB_NAME ??
                "BancoFuego",

            user:
                process.env.DB_USER ??
                "postgres",

            /*
             * Conservamos el valor predeterminado de
             * la V1.5 para no romper la configuración
             * actual del equipo.
             */
            password:
                process.env.DB_PASSWORD ??
                "Admin123456",

            max:
                this.obtenerNumeroPositivo(
                    process.env.DB_POOL_MAX,
                    10
                ),

            idleTimeoutMillis:
                this.obtenerNumeroPositivo(
                    process.env
                        .DB_IDLE_TIMEOUT_MS,
                    30000
                ),

            connectionTimeoutMillis:
                this.obtenerNumeroPositivo(
                    process.env
                        .DB_CONNECTION_TIMEOUT_MS,
                    5000
                )
        };
    }

    private static obtenerPuerto(): number {
        return this.obtenerNumeroPositivo(
            process.env.DB_PORT,
            5432
        );
    }

    private static obtenerNumeroPositivo(
        valor: string | undefined,
        valorPredeterminado: number
    ): number {
        if (!valor) {
            return valorPredeterminado;
        }

        const numero =
            Number(valor);

        if (
            !Number.isInteger(numero) ||
            numero <= 0
        ) {
            return valorPredeterminado;
        }

        return numero;
    }

    private static registrarEventos(
        pool: Pool
    ): void {
        pool.on(
            "error",
            error => {
                console.error(
                    "Error inesperado en el pool de PostgreSQL:",
                    error.message
                );
            }
        );
    }
}