import { createHash } from "crypto";

export class IdempotenciaService {
    public crearHash(
        datos: unknown
    ): string {
        const contenido = JSON.stringify(datos);

        return createHash("sha256")
            .update(contenido)
            .digest("hex");
    }

    public normalizarClave(
        clave: string | undefined
    ): string | undefined {
        if (clave === undefined) {
            return undefined;
        }

        const claveLimpia =
            clave.trim();

        if (claveLimpia.length === 0) {
            return undefined;
        }

        if (claveLimpia.length > 100) {
            throw new Error(
                "La clave de idempotencia no puede superar los 100 caracteres"
            );
        }

        return claveLimpia;
    }
}