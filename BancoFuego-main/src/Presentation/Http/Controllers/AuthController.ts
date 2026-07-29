import {
    NextFunction,
    Request,
    Response
} from "express";

import { AutenticacionService } from "../../../Application/Services/AutenticacionService";
import { AutenticacionRequestDto } from "../../../Application/DTOs/AutenticacionDto";

export class AuthController {
    constructor(
        private readonly autenticacionService:
            AutenticacionService
    ) {}

    public login = async (
        req: Request<
            Record<string, never>,
            unknown,
            AutenticacionRequestDto
        >,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const resultado =
                await this.autenticacionService.autenticar(
                    req.body
                );

            res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    };
}