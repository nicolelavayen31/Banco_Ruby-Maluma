export interface IMapeoCuentaRedBancaria {
    /**
     * @param numeroCuentaLocal Número de cuenta interno de BancoFuego.
     * @returns el account_id (UUID) correspondiente en la red.
     * @throws si la cuenta no tiene un mapeo registrado todavía.
     */
    resolverAccountIdRed(numeroCuentaLocal: string): Promise<string>;
}