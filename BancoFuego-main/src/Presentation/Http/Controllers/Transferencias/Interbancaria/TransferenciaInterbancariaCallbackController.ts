
import { NextFunction, Request, Response } from "express";
import { ProcesarRespuestaInterbancariaService } from "../../../../../Application/Services/Transferencias/Interbancaria/ProcesarRespuestaInterbancariaService";
import { RespuestaCallbackInterbancarioRequestDto } from "../../../../../Application/DTOs/Transferencias/Interbancaria/RespuestaCallbackInterbancarioDto";

export class TransferenciaInterbancariaCallbackController {
    constructor(
        private readonly procesarRespuestaService:
            ProcesarRespuestaInterbancariaService
    ) { }

    public procesar = async (
        req: Request<
            unknown,
            unknown,
            RespuestaCallbackInterbancarioRequestDto
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            await this.procesarRespuestaService.procesar(
                req.body
            );

            res.status(200).json({ recibido: true });
        } catch (error) {
            next(error);
        }
    };
}