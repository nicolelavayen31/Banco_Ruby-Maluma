import { NextFunction, Request, Response } from "express";
import { ITokenService } from "../../../Application/Ports/ITokenService";

export class AuthMiddleware {
    constructor(
        private readonly tokenService: ITokenService
    ) {}

    public verificar = (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        try {
            const autorizacion = req.headers.authorization;

            if (!autorizacion) {
                res.status(401).json({

                    mensaje: "Debes proporcionar un token"

                });

                return;
            }

            const [
                tipo,
                token
            ] = autorizacion.split(" ");

            if (
                tipo !== "Bearer" ||
                !token
            ) {
                res.status(401).json({
                    mensaje:
                        "El formato del token no es válido"
                });

                return;
            }

            const datos = this.tokenService.verificar( token );
            res.locals.autenticacion = datos;
            next();

        } catch {
            res.status(401).json({

                mensaje: "El token no es válido o ha expirado"
                
            });
        }
    };
}