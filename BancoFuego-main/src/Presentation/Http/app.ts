import cors, {
    CorsOptions
} from "cors";

import express, {
    Application,
    NextFunction,
    Request,
    Response
} from "express";

import { errorHandler } from "./Middleware/ErrorHandler";
import { notFoundHandler } from "./Middleware/NotFoundHandler";
import { requestIdMiddleware } from "./Middleware/RequestIdMiddleware";

import { apiRoutes } from "./Routes";
import { docsRoutes } from "./Routes/DocsRoutes";
import helmet from "helmet";

const app: Application =
    express();

app.disable(
    "x-powered-by"
);

app.use(
    helmet()
);

app.use(
    requestIdMiddleware
);

const origenesPermitidos =
    (
        process.env.CORS_ORIGINS ??
        "http://localhost:4200"
    )
        .split(",")
        .map(
            origen =>
                origen.trim()
        )
        .filter(
            origen =>
                origen.length > 0
        );

const corsOptions:
    CorsOptions = {
    origin: (
        origin,
        callback
    ) => {
        /*
         * Postman, la consola y otros servidores
         * pueden hacer solicitudes sin Origin.
         */
        if (!origin) {
            callback(
                null,
                true
            );

            return;
        }

        if (
            origenesPermitidos.includes(
                origin
            )
        ) {
            callback(
                null,
                true
            );

            return;
        }

        callback(
            new Error(
                "El origen no está autorizado por CORS"
            )
        );
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "X-Request-Id"
    ],

    exposedHeaders: [
        "X-Request-Id"
    ]
};

app.use(
    cors(corsOptions)
);

app.use(
    express.json({
        limit: "100kb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "100kb"
    })
);

app.use(
    "/docs",
    docsRoutes
);

app.get(
    "/health",
    (
        _req: Request,
        res: Response
    ): void => {
        const requestId =
            res.locals.requestId as
            string | undefined;

        res.status(200).json({
            estado: "OK",
            servicio: "BancoFuego API",
            version: "2.0.0",

            ...(requestId
                ? {
                    requestId
                }
                : {}),

            fecha:
                new Date().toISOString()
        });
    }
);

app.use(
    "/api",
    apiRoutes
);

/*
 * Maneja cuerpos JSON mal formados.
 */
app.use(
    (
        error: unknown,
        _req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        if (
            error instanceof SyntaxError &&
            "body" in error
        ) {
            const requestId =
                res.locals.requestId as
                string | undefined;

            res.status(400).json({
                mensaje:
                    "El cuerpo JSON de la solicitud no es válido",

                codigo:
                    "JSON_INVALIDO",

                ...(requestId
                    ? {
                        requestId
                    }
                    : {}),

                fecha:
                    new Date().toISOString()
            });

            return;
        }

        next(error);
    }
);

app.use(
    notFoundHandler
);

app.use(
    errorHandler
);

export { app };