export class TarjetaQueries {
    public static readonly BUSCAR_POR_NUMERO = `
        SELECT
            id_tarjeta,
            numero_tarjeta,
            fecha_vencimiento,
            cvv,
            activa,
            id_cuenta
        FROM BancoFuego.Tarjeta
        WHERE numero_tarjeta = $1
    `;

    public static readonly BUSCAR_POR_ID = `
        SELECT
            id_tarjeta,
            numero_tarjeta,
            fecha_vencimiento,
            cvv,
            activa,
            id_cuenta
        FROM BancoFuego.Tarjeta
        WHERE id_tarjeta = $1
    `;

    public static readonly CREAR = `
        INSERT INTO BancoFuego.Tarjeta (
            numero_tarjeta,
            fecha_vencimiento,
            cvv,
            activa,
            id_cuenta
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_tarjeta
    `;

    public static readonly ACTUALIZAR = `
        UPDATE BancoFuego.Tarjeta
        SET
            activa = $1
        WHERE id_tarjeta = $2
    `;
}