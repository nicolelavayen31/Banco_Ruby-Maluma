import { randomUUID } from "crypto";
import {
    NextFunction,
    Request,
    Response
} from "express";

export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const requestIdRecibido =
        req.header("X-Request-Id");

    const requestId =
        requestIdRecibido?.trim() ||
        randomUUID();

    res.locals.requestId =
        requestId;

    res.setHeader(
        "X-Request-Id",
        requestId
    );

    next();
}