export class TransaccionQueries {
    public static readonly CREAR = `
        INSERT INTO BancoFuego.Transaccion (
            tipo,
            monto,
            estado,
            fecha,
            descripcion,
            id_cajero,
            referencia_externa,
            estado_detalle,
            updated_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
        )
        RETURNING id_transaccion
    `;

    public static readonly ACTUALIZAR = `
        UPDATE BancoFuego.Transaccion
        SET
            estado = $1,
            referencia_externa = $2,
            estado_detalle = $3,
            updated_at = $4
        WHERE id_transaccion = $5
    `;

    public static readonly BUSCAR_POR_ID = `
        SELECT
            id_transaccion,
            tipo,
            monto,
            estado,
            fecha,
            descripcion,
            id_cajero,
            referencia_externa,
            estado_detalle,
            updated_at
        FROM BancoFuego.Transaccion
        WHERE id_transaccion = $1
    `;

    public static readonly BUSCAR_TODAS_POR_IDS = `
        SELECT
            id_transaccion,
            tipo,
            monto,
            estado,
            fecha,
            descripcion,
            id_cajero,
            referencia_externa,
            estado_detalle,
            updated_at
        FROM BancoFuego.Transaccion
        WHERE id_transaccion = ANY($1::int[])
        ORDER BY id_transaccion ASC
    `;

    public static readonly BUSCAR_PENDIENTES_INTERBANCARIAS = `
        SELECT
            id_transaccion,
            tipo,
            monto,
            estado,
            fecha,
            descripcion,
            id_cajero,
            referencia_externa,
            estado_detalle,
            updated_at
        FROM BancoFuego.Transaccion
        WHERE tipo = 'TRANSFERENCIA_EXTERNA'
            AND estado = 'PENDIENTE'
            AND referencia_externa IS NOT NULL
        ORDER BY updated_at ASC, id_transaccion ASC
        LIMIT $1
    `;

    public static readonly BUSCAR_POR_ID_PARA_ACTUALIZAR = `
        SELECT
            id_transaccion,
            tipo,
            monto,
            estado,
            fecha,
            descripcion,
            id_cajero,
            referencia_externa,
            estado_detalle,
            updated_at
        FROM BancoFuego.Transaccion
        WHERE id_transaccion = $1
        FOR UPDATE
    `;

    public static readonly BUSCAR_POR_REFERENCIA_EXTERNA_PARA_ACTUALIZAR = `
    SELECT
        id_transaccion,
        tipo,
        monto,
        estado,
        fecha,
        descripcion,
        id_cajero,
        referencia_externa,
        estado_detalle,
        updated_at
    FROM BancoFuego.Transaccion
    WHERE referencia_externa = $1
    FOR UPDATE
`;
}