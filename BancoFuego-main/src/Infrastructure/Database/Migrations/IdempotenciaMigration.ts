import { PoolClient } from "pg";

import { IMigration } from "./IMigration";

export class IdempotenciaMigration
    implements IMigration {

    public readonly nombre =
        "001_idempotencia_operaciones";

    public async ejecutar(
        cliente: PoolClient
    ): Promise<void> {
        await cliente.query(`
            CREATE SCHEMA IF NOT EXISTS
                BancoFuego
        `);

        await cliente.query(`
            CREATE TABLE IF NOT EXISTS
                BancoFuego.IdempotenciaOperacion (
                    id_idempotencia
                        SERIAL
                        PRIMARY KEY,

                    id_cuenta
                        INTEGER
                        NOT NULL,

                    operacion
                        VARCHAR(40)
                        NOT NULL,

                    idempotency_key
                        VARCHAR(100)
                        NOT NULL,

                    request_hash
                        VARCHAR(64)
                        NOT NULL,

                    estado
                        VARCHAR(20)
                        NOT NULL,

                    respuesta_http
                        INTEGER,

                    respuesta_body
                        JSONB,

                    created_at
                        TIMESTAMP
                        NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,

                    updated_at
                        TIMESTAMP
                        NOT NULL
                        DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT
                        ck_idempotencia_estado
                    CHECK (
                        estado IN (
                            'EN_PROCESO',
                            'COMPLETADA'
                        )
                    ),

                    CONSTRAINT
                        uq_idempotencia_operacion
                    UNIQUE (
                        id_cuenta,
                        operacion,
                        idempotency_key
                    )
                )
        `);

        await cliente.query(`
            CREATE INDEX IF NOT EXISTS
                idx_idempotencia_cuenta
            ON BancoFuego.IdempotenciaOperacion (
                id_cuenta
            )
        `);

        await cliente.query(`
            CREATE INDEX IF NOT EXISTS
                idx_idempotencia_estado
            ON BancoFuego.IdempotenciaOperacion (
                estado
            )
        `);

        await cliente.query(`
            CREATE INDEX IF NOT EXISTS
                idx_idempotencia_created_at
            ON BancoFuego.IdempotenciaOperacion (
                created_at
            )
        `);
    }
}