import { Cuenta } from "../../Domain/Entities/Cuenta";

export interface ICuentaRepository {
    buscarPorId(id: number): Promise<Cuenta | null>;
    buscarPorIdParaActualizar(id: number): Promise<Cuenta | null>;
    buscarPorNumeroCuentaParaActualizar(numeroCuenta: string): Promise<Cuenta | null>;
    crear(cuenta: Cuenta): Promise<number>;    // siempre INSERT, devuelve id generado
    actualizar(cuenta: Cuenta): Promise<void>; // siempre UPDATE, la cuenta ya tiene id
}