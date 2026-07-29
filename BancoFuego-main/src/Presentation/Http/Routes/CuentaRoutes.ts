import { Router } from "express";
import { authMiddleware, cuentaController } from "../../../Bootstrap/CompositionRoot";

const cuentaRoutes = Router();

cuentaRoutes.get(
    "/me",
    authMiddleware.verificar,
    cuentaController.obtenerPropia
);

cuentaRoutes.get(
    "/:id",
    cuentaController.obtenerPorId
);

export { cuentaRoutes };