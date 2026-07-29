import { Router } from "express";

import { authMiddleware, historialController } from "../../../Bootstrap/CompositionRoot";

const historialRoutes = Router();

historialRoutes.use(
    authMiddleware.verificar
);

historialRoutes.get(
    "/me",
    historialController.obtenerPropio
);

export { historialRoutes };