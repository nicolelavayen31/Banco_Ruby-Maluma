using Npgsql;
using System;
using System.Threading.Tasks;

namespace BancoMaluma.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(string connectionString)
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            string dbName = builder.Database ?? "Banco Maluma";
            
            // 1. Connect to default 'postgres' db to check / create database
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

            // 2. Connect to target database and execute tables creation and seed script
            builder.Database = dbName;
            using (var conn = new NpgsqlConnection(builder.ConnectionString))
            {
                await conn.OpenAsync();

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

INSERT INTO cuenta (usuario_id, numero_cuenta, saldo, tipo_cuenta, cupo_sobregiro, estado)
VALUES (
    (SELECT usuario_id FROM usuario WHERE nombre = 'maluma' AND pin = '2026' ORDER BY usuario_id ASC LIMIT 1),
    '9999888877776666',
    500.00,
    'Corriente',
    200.00,
    TRUE
)
ON CONFLICT (numero_cuenta) DO UPDATE
SET saldo = EXCLUDED.saldo,
    tipo_cuenta = EXCLUDED.tipo_cuenta,
    cupo_sobregiro = EXCLUDED.cupo_sobregiro,
    estado = EXCLUDED.estado;
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
