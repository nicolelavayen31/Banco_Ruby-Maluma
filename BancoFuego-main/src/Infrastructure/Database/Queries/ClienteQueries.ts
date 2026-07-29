export class ClienteQueries {
    public static readonly BUSCAR_POR_ID = `
        SELECT
            id_cliente,
            cedula,
            nombres,
            apellidos,
            telefono,
            correo,
            direccion,
            fecha_registro,
            activo
        FROM BancoFuego.Cliente
        WHERE id_cliente = $1
    `;
}
