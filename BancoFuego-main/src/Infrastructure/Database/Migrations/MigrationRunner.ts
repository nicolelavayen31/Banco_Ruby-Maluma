import { PoolClient } from "pg";
import { PostgresConnection } from "../PostgresConnection";
import { AlinearEsquemaOperacionesMigration } from "./AlinearEsquemaOperacionesMigration";
import { IdempotenciaMigration } from "./IdempotenciaMigration";
import { IMigration } from "./IMigration";


export class MigrationRunner {
    private readonly migraciones:
        IMigration[] = [
            new IdempotenciaMigration(),
            new AlinearEsquemaOperacionesMigration()
        ];

    public async ejecutar():
        Promise<void> {
        const pool =
            PostgresConnection.obtenerPool();

        const cliente =
            await pool.connect();

        try {
            await cliente.query(
                "BEGIN"
            );

            await this.crearTablaControl(
                cliente
            );

            for (
                const migracion
                of this.migraciones
            ) {
                const ejecutada =
                    await this.estaEjecutada(
                        cliente,
                        migracion.nombre
                    );

                if (ejecutada) {
                    console.log(
                        `Migración omitida: ${migracion.nombre}`
                    );

                    continue;
                }

                console.log(
                    `Ejecutando migración: ${migracion.nombre}`
                );

                await migracion.ejecutar(
                    cliente
                );

                await this.registrarMigracion(
                    cliente,
                    migracion.nombre
                );

                console.log(
                    `Migración completada: ${migracion.nombre}`
                );
            }

            await cliente.query(
                "COMMIT"
            );
        } catch (error) {
            try {
                await cliente.query(
                    "ROLLBACK"
                );
            } catch {
                // Se conserva el error original.
            }

            throw error;
        } finally {
            cliente.release();
        }
    }

    private async crearTablaControl(
        cliente: PoolClient
    ): Promise<void> {
        await cliente.query(`
            CREATE SCHEMA IF NOT EXISTS
                BancoFuego
        `);

        await cliente.query(`
            CREATE TABLE IF NOT EXISTS
                BancoFuego.SchemaMigration (
                    id_migracion
                        SERIAL
                        PRIMARY KEY,

                    nombre
                        VARCHAR(150)
                        NOT NULL
                        UNIQUE,

                    ejecutada_en
                        TIMESTAMP
                        NOT NULL
                        DEFAULT CURRENT_TIMESTAMP
                )
        `);
    }

    private async estaEjecutada(
        cliente: PoolClient,
        nombre: string
    ): Promise<boolean> {
        const resultado =
            await cliente.query<{
                existe: boolean;
            }>(
                `
                    SELECT EXISTS (
                        SELECT 1
                        FROM BancoFuego.SchemaMigration
                        WHERE nombre = $1
                    ) AS existe
                `,
                [
                    nombre
                ]
            );

        return resultado
            .rows[0]
            ?.existe ?? false;
    }

    private async registrarMigracion(
        cliente: PoolClient,
        nombre: string
    ): Promise<void> {
        await cliente.query(
            `
                INSERT INTO
                    BancoFuego.SchemaMigration (
                        nombre
                    )
                VALUES ($1)
            `,
            [
                nombre
            ]
        );
    }
}