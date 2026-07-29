import { MensajeTui } from "./TuiTypes";

export class TuiMensajes {
    public static error(
        titulo: string,
        contenido: string
    ): MensajeTui {
        return {
            titulo,
            contenido,
            error: true
        };
    }

    public static exito(
        titulo: string,
        contenido: string
    ): MensajeTui {
        return {
            titulo,
            contenido,
            error: false
        };
    }

    public static desdeError(
        titulo: string,
        error: unknown,
        mensajePredeterminado: string
    ): MensajeTui {
        return this.error(
            titulo,
            error instanceof Error
                ? error.message
                : mensajePredeterminado
        );
    }
}