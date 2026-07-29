import { NextFunction, Request, Response } from "express";
import { DatosToken } from "../../../../Application/Ports/ITokenService";
import { TransferenciaService } from "../../../../Application/Services/Transferencias/TransferenciaService";
import { TransferenciaRequest } from "../../../Contracts/Api/Transferencias/TransferenciaContracts";

export class TransferenciaController {
    constructor(
        private readonly transferenciaService: TransferenciaService
    ) {}

    public transferir = async (
        req: Request<
            Record<string, never>,
            unknown,
            TransferenciaRequest
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const autenticacion = res.locals.autenticacion as DatosToken;
            const idempotencyKey =
                req.header(
                    "Idempotency-Key"
                ) ?? undefined;

            const cuerpo = req.body;
            const resultado =
                cuerpo.tipoTransferencia === "LOCAL"
                    ? await this.transferenciaService.ejecutar({
                        
                        tipoTransferencia: "LOCAL",
                        cuentaOrigenId: autenticacion.cuentaId,
                        numeroCuentaDestino: cuerpo.numeroCuentaDestino,
                        monto: cuerpo.monto,
                        idempotencyKey
                    })
                    : await this.transferenciaService.ejecutar({
                        
                        tipoTransferencia: "INTERBANCARIA",
                        cuentaOrigenId: autenticacion.cuentaId,
                        numeroCuentaDestino: cuerpo.numeroCuentaDestino,
                        codigoBancoDestino: cuerpo.codigoBancoDestino,
                        monto: cuerpo.monto,
                        concepto: cuerpo.concepto,
                        idempotencyKey
                    });

            res.status(201).json(
                resultado
            );
        } catch (error: unknown) {
            next(error);
        }
    };
}