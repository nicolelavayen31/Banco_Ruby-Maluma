import { Cliente } from "../../Domain/Entities/Cliente";

export interface IClienteRepository {
    buscarPorId(id: number): Promise<Cliente | null>;
}
