import { ResultadoTransferenciaInterbancaria } from "../../../../Application/Ports/Transferencias/Interbancaria/IRedBancariaClient";

/**
 * Forma mínima de una Transaction de la red que nos importa para
 * interpretar el resultado de una transferencia. No usamos el tipo
 * completo del schema de la API a propósito: esta función solo necesita
 * el campo "state", así que solo le pedimos eso.
 */
export interface TransaccionRed {
    state: string;
}

/**
 * Traduce el array de transacciones que devuelve la red interbancaria
 * (débito + crédito de la misma operación) hacia nuestro
 * ResultadoTransferenciaInterbancaria del dominio.
 *
 * Función pura: sin I/O, sin dependencias de infraestructura. Por eso
 * vive separada de RedBancariaHttpClient y se puede testear sin mockear
 * nada.
 */
export function interpretarRespuestaTransferencia(
    transacciones: TransaccionRed[],
    correlationId: string
): ResultadoTransferenciaInterbancaria {
    if (transacciones.length === 0) {
        throw new Error(
            `La red no devolvió transacciones para correlation_id ` +
            `${correlationId}. Respuesta inesperada.`
        );
    }

    const estados = new Set(transacciones.map((t) => t.state));
    if (estados.size > 1) {
        // No debería pasar (débito y crédito de la misma operación
        // deberían compartir estado), pero lo dejamos explícito por si
        // la red se comporta distinto a lo esperado.
        throw new Error(
            `Transacciones con estados inconsistentes para ` +
            `correlation_id ${correlationId}: ${[...estados].join(", ")}`
        );
    }

    const estado = transacciones[0].state;

    switch (estado) {
        case "success":
            return {
                estado: "ACEPTADA",
                referenciaExterna: correlationId
            };
        case "pending":
            return {
                estado: "PENDIENTE",
                referenciaExterna: correlationId
            };
        case "cancelled":
            return {
                estado: "RECHAZADA",
                // TODO-FASE1: la red no expone un código de motivo en
                // la Transaction. Confirmar con el grupo administrador
                // cómo se obtiene el detalle real del rechazo.
                codigoError: "RECHAZADA_POR_RED",
                mensaje: "La red interbancaria canceló la transacción."
            };
        default:
            throw new Error(
                `Estado de transacción no reconocido: "${estado}"`
            );
    }
}