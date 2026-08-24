-- 1. Crear tablas

CREATE TABLE usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pin VARCHAR(100) NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cuenta (
    cuenta_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id),
    numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
    saldo NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    integrador_account_id VARCHAR(100) NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria (
    auditoria_id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuenta(cuenta_id),
    numero_cuenta VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto NUMERIC(18,2) NOT NULL,
    descripcion TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insertar usuario "fuego" con PIN "2026"
INSERT INTO usuario (nombre, pin)
VALUES ('fuego', '$2a$11$IE5ImhojoQGfLwOnWejplemNwbxuVdwg.b8ve2yyxknaPH0nVBwj6');

-- 3. Insertar cuentas iniciales de Banco Fuego (valores de credenciales-banco_fuego.txt)
-- Cuenta Corriente (checking): BF-ACC-001 (UUID: 550e8400-e29b-41d4-a716-446655440203) - Balance: $20,130.00 (2013000 centavos)
INSERT INTO cuenta (usuario_id, numero_cuenta, saldo, estado, integrador_account_id)
VALUES (
    (SELECT usuario_id FROM usuario WHERE nombre = 'fuego' LIMIT 1),
    '8888777766665555',
    20130.00,
    TRUE,
    '550e8400-e29b-41d4-a716-446655440203'
);

-- Cuenta Ahorros (savings): BF-ACC-002 (UUID: 550e8400-e29b-41d4-a716-446655440204) - Balance: $30,000.00 (3000000 centavos)
INSERT INTO cuenta (usuario_id, numero_cuenta, saldo, estado, integrador_account_id)
VALUES (
    (SELECT usuario_id FROM usuario WHERE nombre = 'fuego' LIMIT 1),
    '8888777766664444',
    30000.00,
    TRUE,
    '550e8400-e29b-41d4-a716-446655440204'
);

-- 4. Registrar auditoría inicial
INSERT INTO auditoria (cuenta_id, numero_cuenta, tipo, monto, descripcion)
VALUES (
    (SELECT cuenta_id FROM cuenta WHERE numero_cuenta = '8888777766665555' LIMIT 1),
    '8888777766665555',
    'Deposit',
    20130.00,
    'Saldo inicial de cuenta corriente BanNet'
);

INSERT INTO auditoria (cuenta_id, numero_cuenta, tipo, monto, descripcion)
VALUES (
    (SELECT cuenta_id FROM cuenta WHERE numero_cuenta = '8888777766664444' LIMIT 1),
    '8888777766664444',
    'Deposit',
    30000.00,
    'Saldo inicial de cuenta de ahorros BanNet'
);
