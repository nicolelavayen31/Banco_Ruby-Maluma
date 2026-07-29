export function obtenerMensajeError(error: unknown): string {
    return error instanceof Error ? error.message : "";
}

export function obtenerNombreError(error: unknown): string {
    return error instanceof Error ? error.name : "";
}

export function errorCoincide(error: unknown, nombre: string, texto: string): boolean {
    return obtenerNombreError(error) === nombre || obtenerMensajeError(error).toLowerCase().includes(texto.toLowerCase());
}