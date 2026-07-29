import {
    NextFunction,
    Request,
    Response
} from "express";

import { DepositoService } from "../../../Application/Services/DepositoService";
import { RetiroService } from "../../../Application/Services/RetiroService";

interface OperacionBody {
    monto: number;
}

interface DatosAutenticacion {
    cuentaId: number;
    numeroCuenta: string;
}

export class OperacionController {
    constructor(
        private readonly depositoService:
            DepositoService,

        private readonly retiroService:
            RetiroService
    ) {}

    public depositar = async (
        req: Request<
            Record<string, never>,
            unknown,
            OperacionBody
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const autenticacion =
                res.locals.autenticacion as
                    DatosAutenticacion;

            const idempotencyKey =
                this.obtenerIdempotencyKey(req);

            const resultado =
                await this.depositoService.ejecutar({
                    cuentaId:
                        autenticacion.cuentaId,

                    monto:
                        req.body.monto,

                    idempotencyKey
                });

            res.status(201).json(resultado);
        } catch (error) {
            next(error);
        }
    };

    public retirar = async (
        req: Request<
            Record<string, never>,
            unknown,
            OperacionBody
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const autenticacion =
                res.locals.autenticacion as
                    DatosAutenticacion;

            const idempotencyKey =
                this.obtenerIdempotencyKey(req);

            const resultado =
                await this.retiroService.ejecutar({
                    cuentaId:
                        autenticacion.cuentaId,

                    monto:
                        req.body.monto,

                    idempotencyKey
                });

            res.status(201).json(resultado);
        } catch (error) {
            next(error);
        }
    };

    private obtenerIdempotencyKey(
        req: Request
    ): string | undefined {
        const valor =
            req.header("Idempotency-Key");

        return valor ?? undefined;
    }
}