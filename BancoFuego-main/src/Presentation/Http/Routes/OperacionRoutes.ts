import { Router } from "express";
import { authMiddleware, operacionController } from "../../../Bootstrap/CompositionRoot";
import { ValidacionMiddleware } from "../Middleware/ValidacionMiddleware";

const operacionRoutes =
    Router();

operacionRoutes.use(
    authMiddleware.verificar
);

operacionRoutes.post(
    "/depositos",
    ValidacionMiddleware.validarIdempotencyKey,
    ValidacionMiddleware.validarMonto,
    operacionController.depositar
);

operacionRoutes.post(
    "/retiros",
    ValidacionMiddleware.validarIdempotencyKey,
    ValidacionMiddleware.validarMonto,
    operacionController.retirar
);

export { operacionRoutes };