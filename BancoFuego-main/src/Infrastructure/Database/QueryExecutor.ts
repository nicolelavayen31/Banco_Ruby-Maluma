import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export type QueryExecutor = Pool | PoolClient;

export async function ejecutarConsulta< T extends QueryResultRow>(

    executor: QueryExecutor,
    consulta: string,
    parametros: unknown[] = []

): Promise<QueryResult<T>> {
    
    return executor.query<T>(
        consulta,
        parametros
    );
}