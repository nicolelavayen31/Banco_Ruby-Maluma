-- Conectarse a la base de datos "Banco Ruby"
\c "Banco Ruby";

-- 1. Estructura de Tablas

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
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    auditoria_id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuenta(cuenta_id),
    numero_cuenta TEXT NOT NULL,
    tipo TEXT NOT NULL,
    monto NUMERIC(18,2) NOT NULL,
    descripcion TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar usuario "nicole"
INSERT INTO usuario (nombre, pin)
VALUES ('nicole', '2003')
ON CONFLICT DO NOTHING;

-- Insertar cuenta de prueba para nicole
INSERT INTO cuenta (usuario_id, numero_cuenta, saldo, estado)
VALUES (
    (SELECT usuario_id FROM usuario WHERE nombre = 'nicole' AND pin = '2003' LIMIT 1),
    '1234567812345678',
    1000.00,
    TRUE
)
ON CONFLICT (numero_cuenta) DO UPDATE
SET saldo = EXCLUDED.saldo,
    estado = EXCLUDED.estado;

-- Insertar auditoría inicial de depósito
INSERT INTO auditoria (cuenta_id, numero_cuenta, tipo, monto, descripcion)
VALUES (
    (SELECT cuenta_id FROM cuenta WHERE numero_cuenta = '1234567812345678' LIMIT 1),
    '1234567812345678',
    'Deposit',
    1000.00,
    'Saldo inicial'
)
ON CONFLICT DO NOTHING;
