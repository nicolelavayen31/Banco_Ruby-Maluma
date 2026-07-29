import { Router } from "express";
import { authController } from "../../../Bootstrap/CompositionRoot";
import { ValidacionMiddleware } from "../Middleware/ValidacionMiddleware";

const authRoutes = Router();

authRoutes.post(
    "/login",
    ValidacionMiddleware.validarLogin,
    authController.login
);

export { authRoutes };