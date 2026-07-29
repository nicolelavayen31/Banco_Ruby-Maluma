export interface OpcionesPeticion {
    metodo?: "GET" | "POST" | "PUT" | "DELETE";
    token?: string;
    cuerpo?: unknown;
    headers?: Record<string, string>;
}

interface RespuestaErrorApi {
    mensaje?: string;
    message?: string;
    error?: string;
}

export class BancoApiClient {
    private tokenSesion?: string;

    constructor(
        private readonly urlBase: string =
            process.env.API_URL ?? "http://localhost:3000/api"
    ) {}

    public establecerToken(token: string): void {
        this.tokenSesion = token;
    }

    public limpiarToken(): void {
        this.tokenSesion = undefined;
    }

    public get<T>(ruta: string, token?: string): Promise<T> {
        return this.enviar<T>(ruta, {
            metodo: "GET",
            token
        });
    }

    public post<T>(
        ruta: string,
        cuerpo?: unknown,
        token?: string,
        headers?: Record<string, string>
    ): Promise<T> {
        return this.enviar<T>(ruta, {
            metodo: "POST",
            cuerpo,
            token,
            headers
        });
    }

    public put<T>(
        ruta: string,
        cuerpo?: unknown,
        token?: string,
        headers?: Record<string, string>
    ): Promise<T> {
        return this.enviar<T>(ruta, {
            metodo: "PUT",
            cuerpo,
            token,
            headers
        });
    }

    public delete<T>(ruta: string, token?: string): Promise<T> {
        return this.enviar<T>(ruta, {
            metodo: "DELETE",
            token
        });
    }

    private async enviar<T>(
        ruta: string,
        opciones: OpcionesPeticion
    ): Promise<T> {
        const url = `${this.urlBase}${ruta}`;

        const headers: Record<string, string> = {
            Accept: "application/json",
            ...opciones.headers
        };

        if (opciones.cuerpo !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        const token =
            opciones.token ?? this.tokenSesion;

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let respuesta: Response;

        try {
            respuesta = await fetch(url, {
                method: opciones.metodo ?? "GET",
                headers,
                body:
                    opciones.cuerpo !== undefined
                        ? JSON.stringify(opciones.cuerpo)
                        : undefined
            });
        } catch {
            throw new Error(
                "No se pudo conectar con la API. Verifica que esté ejecutándose."
            );
        }

        const texto = await respuesta.text();
        const contenido = this.convertirRespuesta(texto);

        if (!respuesta.ok) {
            throw new Error(
                this.obtenerMensajeError(
                    contenido,
                    `La API respondió con estado ${respuesta.status}.`
                )
            );
        }

        return contenido as T;
    }

    private convertirRespuesta(texto: string): unknown {
        if (!texto) {
            return undefined;
        }

        try {
            return JSON.parse(texto);
        } catch {
            return texto;
        }
    }

    private obtenerMensajeError(
        contenido: unknown,
        mensajePredeterminado: string
    ): string {
        if (typeof contenido === "string" && contenido.trim()) {
            return contenido;
        }

        if (contenido && typeof contenido === "object") {
            const error = contenido as RespuestaErrorApi;

            return (
                error.mensaje ??
                error.message ??
                error.error ??
                mensajePredeterminado
            );
        }

        return mensajePredeterminado;
    }
}