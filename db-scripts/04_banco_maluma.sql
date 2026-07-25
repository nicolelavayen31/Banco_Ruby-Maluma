-- Conectarse a la base de datos "Banco Maluma"
\c "Banco Maluma";

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
    tipo_cuenta TEXT NOT NULL DEFAULT 'Ahorros',
    cupo_sobregiro NUMERIC(18,2) NOT NULL DEFAULT 0,
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

-- 2. Datos de Semilla (Seeds)

-- Insertar usuario "maluma"
INSERT INTO usuario (nombre, pin)
VALUES ('maluma', '2026')
ON CONFLICT DO NOTHING;

-- Insertar cuenta de prueba para maluma
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
