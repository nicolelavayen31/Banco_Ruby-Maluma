import { Movimiento } from "../../Domain/Entities/Movimiento";

export interface IMovimientoRepository {
    crear(
        movimiento: Movimiento
    ): Promise<number>;

    buscarPorCuentaId(
        idCuenta: number,
        limite?: number,
        offset?: number
    ): Promise<Movimiento[]>;

    buscarPorTransaccionId(
        idTransaccion: number
    ): Promise<Movimiento[]>;
}