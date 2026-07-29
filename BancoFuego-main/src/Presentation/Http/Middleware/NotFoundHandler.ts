import {
    Request,
    Response
} from "express";

export function notFoundHandler(
    req: Request,
    res: Response
): void {
    res.status(404).json({
        mensaje:
            "La ruta solicitada no existe",

        codigo:
            "RUTA_NO_ENCONTRADA",

        ruta:
            `${req.method} ${req.originalUrl}`,

        fecha:
            new Date().toISOString()
    });
}