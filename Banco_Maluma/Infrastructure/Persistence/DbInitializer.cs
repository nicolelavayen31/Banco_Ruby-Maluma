using Npgsql;
using System;
using System.Threading.Tasks;

namespace BancoMaluma.Infrastructure.Persistence
{
    /// <summary>
    /// Utilidad de infraestructura para la inicialización y migración inicial de la base de datos de Banco Maluma.
    /// Ejecuta sentencias directas ADO.NET usando <see cref="NpgsqlConnection"/> para garantizar la existencia de tablas y datos semilla.
    /// </summary>
    public static class DbInitializer
    {
        /// <summary>
        /// Crea la base de datos de Banco Maluma si no existe y ejecuta el script DDL de creación de tablas y semilla.
        /// </summary>
        /// <param name="connectionString">Cadena de conexión de PostgreSQL.</param>
        /// <returns>Tarea asíncrona de inicialización.</returns>
        public static async Task InitializeAsync(string connectionString)
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            string dbName = builder.Database ?? "Banco Maluma";
            
            // 1. Se conecta temporalmente a la base de datos por defecto 'postgres' para comprobar y crear la base de datos objetivo.
            builder.Database = "postgres";
            using (var masterConn = new NpgsqlConnection(builder.ConnectionString))
            {
                await masterConn.OpenAsync();
                using (var checkCmd = new NpgsqlCommand($"SELECT 1 FROM pg_database WHERE datname = '{dbName}';", masterConn))
                {
                    var exists = await checkCmd.ExecuteScalarAsync();
                    if (exists == null)
                    {
                        using (var createCmd = new NpgsqlCommand($"CREATE DATABASE \"{dbName}\";", masterConn))
                        {
                            await createCmd.ExecuteNonQueryAsync();
                            Console.WriteLine($"[DbInitializer Banco Maluma] Base de datos '{dbName}' creada exitosamente.");
                        }
                    }
                }
            }

            // 2. Se conecta a la base de datos destino 'Banco Maluma' para ejecutar el script DDL de creación de tablas y semilla.
            builder.Database = dbName;
            using (var conn = new NpgsqlConnection(builder.ConnectionString))
            {
                await conn.OpenAsync();

                // Script SQL nativo para estructurar las tablas relacionales usuario, cuenta y auditoria.
                string script = @"
CREATE TABLE IF NOT EXISTS usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    pin TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuenta (
    cuenta_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id),
    numero_cuenta TEXT NOT NULL UNIQUE,
    saldo NUMERIC(18,2) NOT NULL DEFAULT 0,
    tipo_cuenta TEXT NOT NULL DEFAULT 'Ahorros',
    cupo_sobregiro NUMERIC(18,2) NOT NULL DEFAULT 0,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cuenta ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT NOT NULL DEFAULT 'Ahorros';
ALTER TABLE cuenta ADD COLUMN IF NOT EXISTS cupo_sobregiro NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE cuenta ADD COLUMN IF NOT EXISTS integrador_account_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS auditoria (
    auditoria_id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuenta(cuenta_id),
    numero_cuenta TEXT NOT NULL,
    tipo TEXT NOT NULL,
    monto NUMERIC(18,2) NOT NULL,
    descripcion TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO usuario (nombre, pin)
VALUES ('maluma', '2026')
ON CONFLICT DO NOTHING;

UPDATE usuario SET nombre = 'maluma', pin = '2026';

INSERT INTO cuenta (usuario_id, numero_cuenta, saldo, tipo_cuenta, cupo_sobregiro, estado, integrador_account_id)
VALUES (
    (SELECT usuario_id FROM usuario WHERE nombre = 'maluma' AND pin = '2026' ORDER BY usuario_id ASC LIMIT 1),
    '9999888877776666',
    500.00,
    'Corriente',
    200.00,
    TRUE,
    '267c00a9-865e-4b6b-af47-c81a021cc040'
)
ON CONFLICT (numero_cuenta) DO UPDATE
SET saldo = EXCLUDED.saldo,
    tipo_cuenta = EXCLUDED.tipo_cuenta,
    cupo_sobregiro = EXCLUDED.cupo_sobregiro,
    estado = EXCLUDED.estado,
    integrador_account_id = EXCLUDED.integrador_account_id;
";
                using (var cmd = new NpgsqlCommand(script, conn))
                {
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("[DbInitializer Banco Maluma] Esquema y datos iniciales aplicados correctamente.");
                }
            }
        }
    }
}
