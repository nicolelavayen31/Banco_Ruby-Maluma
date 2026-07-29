// Application/Ports/ITarjetaRepository.ts
import { Tarjeta } from "../../Domain/Entities/Tarjeta";
import { NumeroTarjeta } from "../../Domain/ValueObjects/NumeroTarjeta";

export interface ITarjetaRepository {
    buscarPorNumero(
        numeroTarjeta: NumeroTarjeta
    ): Promise<Tarjeta | null>;

    buscarPorId(
        id: number
    ): Promise<Tarjeta | null>;

    crear(
        tarjeta: Tarjeta
    ): Promise<number>;

    actualizar(
        tarjeta: Tarjeta
    ): Promise<void>;
}