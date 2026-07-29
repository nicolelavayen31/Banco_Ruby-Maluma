// Infrastructure/RedBancaria/Http/tipos-red.ts

export interface TransactionRed {
    id: string;
    amount: number;
    operation: "withdrawal" | "deposit" | "transfer" | "balance_inquiry" | "pin_change" | "reversal" | "mini_statement";
    type: "debit" | "credit";
    state: "pending" | "success" | "cancelled";
    description: string;
    bankAccountId: string;
    correlationId: string;
    sourceBank: "bank_a" | "bank_b";
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface TransferResponseRed {
    data: TransactionRed[];
    metadata: unknown; // ResponseMetadata del spec, tipalo si lo necesitás
}

export interface GetTransactionsResponseRed {
    data: TransactionRed[];
    metadata: unknown;
}

/**
 * Espejo de ApiResponseError del spec de la red. Se recibe en el body
 * cuando la respuesta HTTP es 4XX/5XX/default.
 */
export interface ApiResponseErrorRed {
    id: string;
    message: string;
    code: string;
    status: number;
    cause: string | null;
    error: string;
    path: string;
    resource: string;
    timestamp: string;
}