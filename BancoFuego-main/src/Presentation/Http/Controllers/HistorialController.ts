import { NextFunction, Request, Response } from "express";
import { HistorialService } from "../../../Application/Services/HistorialService";

interface DatosAutenticacion {
    cuentaId: number;
    numeroCuenta: string;
}

export class HistorialController {
    constructor(
        private readonly historialService: HistorialService
    ) {}

    public obtenerPropio = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const autenticacion =
                res.locals.autenticacion as
                    DatosAutenticacion;

            const historial =
                await this.historialService
                    .obtenerPorCuenta(
                        autenticacion.cuentaId
                    );

            res.status(200).json(historial);
        } catch (error) {
            next(error);
        }
    };
}