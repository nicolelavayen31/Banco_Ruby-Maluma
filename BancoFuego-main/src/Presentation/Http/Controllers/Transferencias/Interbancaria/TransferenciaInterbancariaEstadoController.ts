import { NextFunction, Request, Response } from "express";
import { TransferenciaInterbancariaEstadoService } from "../../../../../Application/Services/Transferencias/Interbancaria/TransferenciaInterbancariaEstadoService";

interface ParametrosEstado {
    transaccionId: string;
}

export class TransferenciaInterbancariaEstadoController {
    constructor(
        private readonly estadoService:
            TransferenciaInterbancariaEstadoService
    ) {}

    public consultar = async (
        req: Request<
            ParametrosEstado,
            unknown,
            unknown
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const transaccionId =
                Number(
                    req.params.transaccionId
                );

            const resultado =
                await this.estadoService.consultarPorId(
                    transaccionId
                );

            res.status(200).json(
                resultado
            );
        } catch (error) {
            next(error);
        }
    };
}