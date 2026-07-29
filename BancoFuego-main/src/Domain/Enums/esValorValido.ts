export function esValorValido<T extends string>(

    valoresPermitidos: readonly T[],
    valor: string

): valor is T {

    return (valoresPermitidos as readonly string[]).includes(valor);
    
}