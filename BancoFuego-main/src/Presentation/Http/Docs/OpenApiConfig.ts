import { openApiSchemas } from "./OpenApiSchemas";
import { openApiPaths } from "./OpenApiPaths";

export const openApiConfig = {
    openapi: "3.0.3",

    info: {
        title: "BancoFuego API",
        version: "2.0.0",
        description:
            "API bancaria para autenticación, consulta de historial, depósitos, retiros y transferencias."
    },

    servers: [
        {
            url: "http://localhost:3000",
            description: "Servidor local"
        }
    ],

    tags: [
        {
            name: "Sistema",
            description: "Estado general de la API"
        },
        {
            name: "Autenticación",
            description: "Inicio de sesión mediante tarjeta y PIN"
        },
        {
            name: "Operaciones",
            description: "Depósitos y retiros"
        },
        {
            name: "Transferencias",
            description:  "Transferencias internas e interbancarias"
        },
        {
            name: "Historial",
            description: "Historial de la cuenta autenticada"
        }
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },

        parameters: {
            IdempotencyKey: {
                name: "Idempotency-Key",
                in: "header",
                required: false,
                description: "Clave única para evitar que una operación repetida se ejecute más de una vez.",
                schema: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100,
                    example: "operacion-2026-0001"
                }
            }
        },
        schemas: openApiSchemas
    },

    paths: openApiPaths
};