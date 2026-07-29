import { PoolClient } from "pg";

import { IMigration } from "./IMigration";

export class AlinearEsquemaOperacionesMigration
    implements IMigration {

    public readonly nombre =
        "002_alinear_esquema_operaciones";

    public async ejecutar(
        cliente: PoolClient
    ): Promise<void> {
        await cliente.query(`
            ALTER TABLE BancoFuego.IdempotenciaOperacion
            ADD COLUMN IF NOT EXISTS id_cuenta INTEGER,
            ADD COLUMN IF NOT EXISTS operacion VARCHAR(40)
        `);

        await cliente.query(`
            ALTER TABLE BancoFuego.Movimiento
            ADD COLUMN IF NOT EXISTS saldo_posterior NUMERIC(18,2)
        `);

        await cliente.query(`
            UPDATE BancoFuego.Movimiento
            SET saldo_posterior = saldo_nuevo
            WHERE saldo_posterior IS NULL
                AND saldo_nuevo IS NOT NULL
        `);

        await cliente.query(`
            UPDATE BancoFuego.IdempotenciaOperacion i
            SET id_cuenta = t.id_cuenta
            FROM BancoFuego.Tarjeta t
            WHERE i.id_cuenta IS NULL
                AND i.numero_tarjeta IS NOT NULL
                AND t.numero_tarjeta = i.numero_tarjeta
        `);

        await cliente.query(`
            UPDATE BancoFuego.IdempotenciaOperacion
            SET operacion = CASE
                WHEN endpoint ILIKE '%deposit%' THEN 'DEPOSITO'
                WHEN endpoint ILIKE '%retiro%' THEN 'RETIRO'
                WHEN endpoint ILIKE '%transfer%' THEN 'TRANSFERENCIA'
                ELSE operacion
            END
            WHERE operacion IS NULL
                AND endpoint IS NOT NULL
        `);

        await cliente.query(`
            DO $$
            DECLARE
                filas_pendientes INTEGER;
            BEGIN
                SELECT COUNT(1)
                INTO filas_pendientes
                FROM BancoFuego.IdempotenciaOperacion
                WHERE id_cuenta IS NULL
                    OR operacion IS NULL;

                IF filas_pendientes > 0 THEN
                    RAISE EXCEPTION
                        'No se pudo alinear IdempotenciaOperacion: % filas sin id_cuenta u operacion',
                        filas_pendientes;
                END IF;
            END
            $$;
        `);

        await cliente.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    JOIN pg_namespace n ON n.oid = t.relnamespace
                    WHERE n.nspname = 'bancofuego'
                        AND t.relname = 'idempotenciaoperacion'
                        AND c.conname = 'uq_idempotencia_operacion'
                ) THEN
                    ALTER TABLE BancoFuego.IdempotenciaOperacion
                    DROP CONSTRAINT uq_idempotencia_operacion;
                END IF;
            END
            $$;
        `);

        await cliente.query(`
            ALTER TABLE BancoFuego.IdempotenciaOperacion
            ALTER COLUMN id_cuenta SET NOT NULL,
            ALTER COLUMN operacion SET NOT NULL
        `);

        await cliente.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'bancofuego'
                        AND table_name = 'movimiento'
                        AND column_name = 'saldo_nuevo'
                ) THEN
                    UPDATE BancoFuego.Movimiento
                    SET saldo_posterior = saldo_nuevo
                    WHERE saldo_posterior IS NULL;
                END IF;
            END
            $$;
        `);

        await cliente.query(`
            ALTER TABLE BancoFuego.Movimiento
            ALTER COLUMN saldo_posterior SET NOT NULL
        `);

        await cliente.query(`
            DO $$
            DECLARE
                duplicados INTEGER;
            BEGIN
                SELECT COUNT(1)
                INTO duplicados
                FROM (
                    SELECT
                        id_cuenta,
                        operacion,
                        idempotency_key
                    FROM BancoFuego.IdempotenciaOperacion
                    GROUP BY
                        id_cuenta,
                        operacion,
                        idempotency_key
                    HAVING COUNT(1) > 1
                ) x;

                IF duplicados > 0 THEN
                    RAISE EXCEPTION
                        'No se pudo crear índice único de idempotencia: existen % combinaciones duplicadas',
                        duplicados;
                END IF;
            END
            $$;
        `);

        await cliente.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS
                uq_idempotencia_operacion_nueva
            ON BancoFuego.IdempotenciaOperacion (
                id_cuenta,
                operacion,
                idempotency_key
            )
        `);

        await cliente.query(`
            CREATE INDEX IF NOT EXISTS
                idx_idempotencia_cuenta_nueva
            ON BancoFuego.IdempotenciaOperacion (
                id_cuenta
            )
        `);

        await cliente.query(`
            CREATE INDEX IF NOT EXISTS
                idx_movimiento_cuenta_fecha
            ON BancoFuego.Movimiento (
                id_cuenta,
                fecha DESC
            )
        `);
    }
}
