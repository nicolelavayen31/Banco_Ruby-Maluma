import { describe, it, expect } from "vitest";
import { interpretarRespuestaTransferencia } from "./InterpretarRespuestaTransferencia";


describe("interpretarRespuestaTransferencia", () => {
    const CORRELATION_ID = "corr-123";

    it("mapea state 'success' a ACEPTADA", () => {
        const resultado = interpretarRespuestaTransferencia(
            [{ state: "success" }, { state: "success" }],
            CORRELATION_ID
        );

        expect(resultado.estado).toBe("ACEPTADA");
        if (resultado.estado === "ACEPTADA") {
            expect(resultado.referenciaExterna).toBe(CORRELATION_ID);
        }
    });

    it("mapea state 'pending' a PENDIENTE", () => {
        const resultado = interpretarRespuestaTransferencia(
            [{ state: "pending" }, { state: "pending" }],
            CORRELATION_ID
        );

        expect(resultado.estado).toBe("PENDIENTE");
        if (resultado.estado === "PENDIENTE") {
            expect(resultado.referenciaExterna).toBe(CORRELATION_ID);
        }
    });

    it("mapea state 'cancelled' a RECHAZADA con código genérico", () => {
        const resultado = interpretarRespuestaTransferencia(
            [{ state: "cancelled" }, { state: "cancelled" }],
            CORRELATION_ID
        );

        expect(resultado.estado).toBe("RECHAZADA");
        if (resultado.estado === "RECHAZADA") {
            expect(resultado.codigoError).toBe("RECHAZADA_POR_RED");
        }
    });

    it("funciona igual con una sola transacción en el array", () => {
        const resultado = interpretarRespuestaTransferencia(
            [{ state: "success" }],
            CORRELATION_ID
        );

        expect(resultado.estado).toBe("ACEPTADA");
    });

    it("lanza error si el array de transacciones viene vacío", () => {
        expect(() =>
            interpretarRespuestaTransferencia([], CORRELATION_ID)
        ).toThrowError(/no devolvió transacciones/);
    });

    it("lanza error si las transacciones tienen estados inconsistentes", () => {
        expect(() =>
            interpretarRespuestaTransferencia(
                [{ state: "success" }, { state: "pending" }],
                CORRELATION_ID
            )
        ).toThrowError(/estados inconsistentes/);
    });

    it("lanza error ante un state no reconocido por el dominio", () => {
        expect(() =>
            interpretarRespuestaTransferencia(
                [{ state: "algo_inesperado" }],
                CORRELATION_ID
            )
        ).toThrowError(/no reconocido/);
    });
});