export class AutenticacionQueries {
    public static readonly BUSCAR_POR_TARJETA_ID = `
        SELECT
            id_autenticacion,
            pin,
            intentos,
            bloqueado,
            id_tarjeta
        FROM BancoFuego.Autenticacion
        WHERE id_tarjeta = $1
    `;

    public static readonly CREAR = `
        INSERT INTO BancoFuego.Autenticacion (
            pin,
            intentos,
            bloqueado,
            id_tarjeta
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id_autenticacion
    `;

    public static readonly ACTUALIZAR = `
        UPDATE BancoFuego.Autenticacion
        SET
            pin = $1,
            intentos = $2,
            bloqueado = $3
        WHERE id_autenticacion = $4
    `;
}