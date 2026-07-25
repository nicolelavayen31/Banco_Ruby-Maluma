-- 1. Estructura de Tablas

CREATE TABLE IF NOT EXISTS agreement (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_account (
    id UUID PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'active',
    agreement_id UUID NOT NULL REFERENCES agreement(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "transaction" (
    id UUID PRIMARY KEY,
    amount INTEGER,
    operation TEXT NOT NULL,
    type TEXT,
    state TEXT NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES bank_account(id) ON DELETE RESTRICT,
    correlation_id UUID,
    source_bank TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    amount INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    agreement_id UUID NOT NULL REFERENCES agreement(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_user (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'active',
    agreement_id UUID NOT NULL REFERENCES agreement(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_refresh_token (
    id UUID PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_profile (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_permission (
    id UUID PRIMARY KEY,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_permission (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES auth_profile(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_key (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'active',
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conciliation (
    id UUID PRIMARY KEY,
    matched INTEGER NOT NULL DEFAULT 0,
    discrepancy INTEGER NOT NULL DEFAULT 0,
    missing INTEGER NOT NULL DEFAULT 0,
    resolved INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conciliation_match (
    id UUID PRIMARY KEY,
    conciliation_id UUID NOT NULL REFERENCES conciliation(id) ON DELETE CASCADE,
    bank_a_tx_id UUID,
    bank_b_tx_id UUID,
    amount_diff INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'matched',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);


-- 2. Datos de Semilla (Seeds Corregidos)

-- Permisos
INSERT INTO auth_permission (id, resource, action, name) VALUES
('b1000001-0000-0000-0000-000000000001', 'accounts', 'read', 'accounts:read'),
('b1000001-0000-0000-0000-000000000002', 'accounts', 'write', 'accounts:write'),
('b1000001-0000-0000-0000-000000000003', 'accounts', 'delete', 'accounts:delete'),
('b1000001-0000-0000-0000-000000000004', 'agreements', 'read', 'agreements:read'),
('b1000001-0000-0000-0000-000000000005', 'agreements', 'write', 'agreements:write'),
('b1000001-0000-0000-0000-000000000006', 'agreements', 'delete', 'agreements:delete'),
('b1000001-0000-0000-0000-000000000007', 'orders', 'read', 'orders:read'),
('b1000001-0000-0000-0000-000000000008', 'orders', 'write', 'orders:write'),
('b1000001-0000-0000-0000-000000000009', 'orders', 'delete', 'orders:delete'),
('b1000001-0000-0000-0000-000000000010', 'transactions', 'read', 'transactions:read'),
('b1000001-0000-0000-0000-000000000011', 'transactions', 'write', 'transactions:write'),
('b1000001-0000-0000-0000-000000000012', 'transactions', 'delete', 'transactions:delete'),
('b1000001-0000-0000-0000-000000000013', 'api_keys', 'read', 'api_keys:read'),
('b1000001-0000-0000-0000-000000000014', 'api_keys', 'write', 'api_keys:write'),
('b1000001-0000-0000-0000-000000000015', 'api_keys', 'delete', 'api_keys:delete'),
('b1000001-0000-0000-0000-000000000016', 'users', 'read', 'users:read'),
('b1000001-0000-0000-0000-000000000017', 'users', 'write', 'users:write'),
('b1000001-0000-0000-0000-000000000018', 'users', 'delete', 'users:delete'),
('b1000001-0000-0000-0000-000000000019', 'profiles', 'read', 'profiles:read'),
('b1000001-0000-0000-0000-000000000020', 'profiles', 'write', 'profiles:write'),
('b1000001-0000-0000-0000-000000000021', 'profiles', 'delete', 'profiles:delete'),
('b1000001-0000-0000-0000-000000000022', 'permissions', 'read', 'permissions:read'),
('b1000001-0000-0000-0000-000000000023', 'audit', 'read', 'audit:read'),
('b1000001-0000-0000-0000-000000000024', 'notifications', 'read', 'notifications:read'),
('b1000001-0000-0000-0000-000000000025', 'notifications', 'write', 'notifications:write')
ON CONFLICT (name) DO NOTHING;

-- Perfiles (Cambiado 'p' inicial por 'f')
INSERT INTO auth_profile (id, name, description) VALUES
('f1000001-0000-0000-0000-000000000001', 'admin', 'Full access to all resources'),
('f1000001-0000-0000-0000-000000000002', 'operator', 'Can process transactions and view accounts'),
('f1000001-0000-0000-0000-000000000003', 'viewer', 'Read-only access for audit and reports'),
('f1000001-0000-0000-0000-000000000004', 'api_client', 'Machine-to-machine access for ATM networks')
ON CONFLICT (name) DO NOTHING;

-- Relaciones de Perfil-Permiso (Admin completo)
INSERT INTO profile_permission (id, profile_id, permission_id)
SELECT 
    gen_random_uuid(), 
    'f1000001-0000-0000-0000-000000000001', 
    id 
FROM auth_permission
ON CONFLICT DO NOTHING;

-- Convenios (Cambiado 'a' inicial por 'a' que sí es hex, pero estandarizado a 'a1000001...')
INSERT INTO agreement (id, name, reference, state) VALUES
('a1000001-0000-0000-0000-000000000001', 'Banco Pichincha', 'PICHINCH', 'active'),
('a1000001-0000-0000-0000-000000000002', 'Banco de Guayaquil', 'GUAYAQIL', 'active'),
('a1000001-0000-0000-0000-000000000003', 'Banco del Pacífico', 'PACIFICO', 'active'),
('a1000001-0000-0000-0000-000000000004', 'Produbanco', 'PRODUBAN', 'active')
ON CONFLICT (reference) DO NOTHING;

-- Cuentas Bancarias de prueba (Cambiado 'ac' inicial por '0c')
INSERT INTO bank_account (id, reference, type, balance, state, agreement_id) VALUES
('0c100001-0000-0000-0000-000000000001', '1234567890', 'savings', 500000, 'active', 'a1000001-0000-0000-0000-000000000001'),
('0c100001-0000-0000-0000-000000000002', '0987654321', 'checking', 1000000, 'active', 'a1000001-0000-0000-0000-000000000002')
ON CONFLICT (reference) DO NOTHING;

-- Usuario Administrador de prueba (Cambiado 'u' inicial por '1')
INSERT INTO auth_user (id, email, password_hash, name, state, agreement_id) VALUES
('11000001-0000-0000-0000-000000000001', 'admin@atm-integrator.local', '$2a$12$R.S9158v1T/L1yC9Lg26Iuz4y58.T5tJswG6vP08v37u.YnEqYtP2', 'System Admin', 'active', 'a1000001-0000-0000-0000-000000000001')
ON CONFLICT (email) DO NOTHING;

-- Vincular usuario administrador con el perfil admin
INSERT INTO user_profile (id, user_id, profile_id) VALUES
(gen_random_uuid(), '11000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;