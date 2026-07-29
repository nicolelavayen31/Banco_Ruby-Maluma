import { Router } from "express";
import {
    transferenciaInterbancariaCallbackController,
    transferenciaInterbancariaEntranteController,
} from "../../../../Bootstrap/CompositionRoot";

const transferenciasInterbancariasRoutes = Router();


transferenciasInterbancariasRoutes.post(
    "/callback",
    transferenciaInterbancariaCallbackController.procesar
);

transferenciasInterbancariasRoutes.post(
    "/recibir",
    transferenciaInterbancariaEntranteController.recibir
);

export {
    transferenciasInterbancariasRoutes
};