-- Conectarse a la base de datos "Banco Ruby"
\c "Banco Ruby";

-- =========================================================================
-- ACTUALIZACIÓN DE CUENTAS (INTEGRADOR BANNET)
-- =========================================================================
-- IMPORTANTE: Reemplaza 'AQUI_TU_NUMERO_DE_CUENTA_CORRIENTE' y 
-- 'AQUI_TU_NUMERO_DE_CUENTA_AHORROS' con los números de cuenta reales 
-- que tienes actualmente en tu base de datos para realizar las pruebas.

-- 1. Actualizar la cuenta corriente (Checking: BR-ACC-001)
UPDATE cuenta 
SET integrador_account_id = '550e8400-e29b-41d4-a716-446655440201'
WHERE numero_cuenta = 'AQUI_TU_NUMERO_DE_CUENTA_CORRIENTE';

-- 2. Actualizar la cuenta de ahorros (Savings: BR-ACC-002)
UPDATE cuenta 
SET integrador_account_id = '550e8400-e29b-41d4-a716-446655440202'
WHERE numero_cuenta = 'AQUI_TU_NUMERO_DE_CUENTA_AHORROS';
