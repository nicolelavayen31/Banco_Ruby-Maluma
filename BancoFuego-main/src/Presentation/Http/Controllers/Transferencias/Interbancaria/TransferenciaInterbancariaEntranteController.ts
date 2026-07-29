import { Request, Response, NextFunction } from "express";
import { RecibirTransferenciaInterbancariaRequestDto } from "../../../../../Application/DTOs/Transferencias/Interbancaria/RecibirTransferenciaInterbancaria";
import { RecibirTransferenciaInterbancariaService } from "../../../../../Application/Services/Transferencias/Interbancaria/RecibirTransferenciaInterbancariaService";

export class TransferenciaInterbancariaEntranteController {
    constructor(
        private readonly recibirService:
            RecibirTransferenciaInterbancariaService
    ) { }

    public recibir = async (
        req: Request<
            unknown,
            unknown,
            RecibirTransferenciaInterbancariaRequestDto
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const resultado =
                await this.recibirService.recibir(req.body);

            const codigoHttp =
                resultado.estado === "ACEPTADA" ? 200 : 422;

            res.status(codigoHttp).json(resultado);
        } catch (error) {
            next(error);
        }
    };
}