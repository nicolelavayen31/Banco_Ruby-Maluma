export class IdempotenciaQueries {
    public static readonly CREAR_SI_NO_EXISTE = `
        INSERT INTO BancoFuego.IdempotenciaOperacion (
            id_cuenta,
            operacion,
            idempotency_key,
            request_hash,
            estado
        )
        VALUES ($1, $2, $3, $4, 'EN_PROCESO')
        ON CONFLICT (
            id_cuenta,
            operacion,
            idempotency_key
        )
        DO NOTHING
        RETURNING id_idempotencia
    `;

    public static readonly BUSCAR_Y_BLOQUEAR = `
        SELECT
            id_cuenta,
            operacion,
            idempotency_key,
            request_hash,
            estado,
            respuesta_http,
            respuesta_body
        FROM BancoFuego.IdempotenciaOperacion
        WHERE id_cuenta = $1
            AND operacion = $2
            AND idempotency_key = $3
        FOR UPDATE
    `;

    public static readonly COMPLETAR = `
        UPDATE BancoFuego.IdempotenciaOperacion
        SET
            estado = 'COMPLETADA',
            respuesta_http = $4,
            respuesta_body = $5::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id_cuenta = $1
            AND operacion = $2
            AND idempotency_key = $3
    `;
}