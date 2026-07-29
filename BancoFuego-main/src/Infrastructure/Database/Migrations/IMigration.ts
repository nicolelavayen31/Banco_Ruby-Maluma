import { PoolClient } from "pg";

export interface IMigration {
    readonly nombre: string;

    ejecutar(
        cliente: PoolClient
    ): Promise<void>;
}