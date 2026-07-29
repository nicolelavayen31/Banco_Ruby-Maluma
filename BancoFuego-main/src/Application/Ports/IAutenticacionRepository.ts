import { Autenticacion } from "../../Domain/Entities/Autenticacion";

export interface IAutenticacionRepository {
    buscarPorTarjetaId(
        idTarjeta: number
    ): Promise<Autenticacion | null>;

    crear(
        autenticacion: Autenticacion
    ): Promise<number>;

    actualizar(
        autenticacion: Autenticacion
    ): Promise<void>;
}