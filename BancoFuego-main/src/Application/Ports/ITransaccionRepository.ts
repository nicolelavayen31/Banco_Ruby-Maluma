import { Transaccion } from "../../Domain/Entities/Transaccion";

export interface ITransaccionRepository {
    crear(
        transaccion: Transaccion
    ): Promise<number>;

    actualizar(
        transaccion: Transaccion
    ): Promise<void>;

    buscarPorId(
        id: number
    ): Promise<Transaccion | null>;

    buscarPorIdParaActualizar(
        id: number
    ): Promise<Transaccion | null>;

    buscarTodosPorIds(
        ids: number[]
    ): Promise<Transaccion[]>;

    buscarPendientesInterbancarias(
        limite?: number
    ): Promise<Transaccion[]>;

    buscarPorReferenciaExternaParaActualizar(
        referenciaExterna: string
    ): Promise<Transaccion | null>;
}