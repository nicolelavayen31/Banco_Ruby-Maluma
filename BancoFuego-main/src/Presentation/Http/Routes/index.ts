import { Router } from "express";
import { authRoutes } from "./AuthRoutes";
import { cuentaRoutes } from "./CuentaRoutes";
import { operacionRoutes } from "./OperacionRoutes";
import { transferenciaRoutes } from "../Routes/Transferencias/TransferenciaRoutes";
import { historialRoutes } from "./HistorialRoutes";
import { transferenciasInterbancariasRoutes } from "./Transferencias/TransferenciasInterbancariasRoutes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);

apiRoutes.use("/cuentas", cuentaRoutes);

apiRoutes.use("/operaciones", operacionRoutes);

apiRoutes.use("/transferencias/interbancarias", transferenciasInterbancariasRoutes);
apiRoutes.use("/transferencias", transferenciaRoutes);

apiRoutes.use("/historial", historialRoutes);

export { apiRoutes };