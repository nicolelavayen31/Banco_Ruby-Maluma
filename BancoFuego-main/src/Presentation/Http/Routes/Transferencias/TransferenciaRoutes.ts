import { Router } from "express";
import {
    authMiddleware,
    transferenciaController,
    transferenciaInterbancariaEstadoController,
} from "../../../../Bootstrap/CompositionRoot";
import { ValidacionMiddleware } from "../../Middleware/ValidacionMiddleware";

const transferenciaRoutes = Router();

transferenciaRoutes.use(
    authMiddleware.verificar
);

transferenciaRoutes.post(
    "/",
    ValidacionMiddleware.validarIdempotencyKey,
    ValidacionMiddleware.validarMonto,
    ValidacionMiddleware.validarTransferencia,
    transferenciaController.transferir
);

transferenciaRoutes.get(
    "/interbancarias/:transaccionId/estado",
    transferenciaInterbancariaEstadoController.consultar
);

export {
    transferenciaRoutes
};