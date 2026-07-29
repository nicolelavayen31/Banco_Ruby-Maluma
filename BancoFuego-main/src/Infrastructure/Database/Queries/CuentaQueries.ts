export class CuentaQueries {
    public static readonly BUSCAR_POR_ID = `
        SELECT
            id_cuenta,
            numero_cuenta,
            tipo,
            saldo,
            fecha_creacion,
            activa,
            id_cliente,
            id_banco
        FROM BancoFuego.Cuenta
        WHERE id_cuenta = $1
    `;

    public static readonly BUSCAR_POR_ID_PARA_ACTUALIZAR = `
        SELECT
            id_cuenta,
            numero_cuenta,
            tipo,
            saldo,
            fecha_creacion,
            activa,
            id_cliente, 
            id_banco
        FROM BancoFuego.Cuenta
        WHERE id_cuenta = $1
        FOR UPDATE
    `;

    public static readonly BUSCAR_POR_NUMERO_CUENTA_PARA_ACTUALIZAR = `
        SELECT
            id_cuenta,
            numero_cuenta,
            tipo,
            saldo,
            fecha_creacion,
            activa,
            id_cliente,
            id_banco
        FROM BancoFuego.Cuenta
        WHERE numero_cuenta = $1
        FOR UPDATE
    `;

    public static readonly CREAR = `
        INSERT INTO BancoFuego.Cuenta (
            numero_cuenta,
            tipo,
            saldo,
            id_cliente,
            id_banco
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_cuenta
    `;

    public static readonly ACTUALIZAR = `
        UPDATE BancoFuego.Cuenta
        SET
            saldo = $1,
            activa = $2
        WHERE id_cuenta = $3
    `;


}