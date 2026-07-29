import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { DatosToken, ITokenService } from "../../Application/Ports/ITokenService";

export class JwtTokenService
    implements ITokenService {

    public generar( datos: DatosToken ): string {

        const secreto = this.obtenerSecreto();
        const opciones: SignOptions = {
            expiresIn: "1h",
            subject: datos.cuentaId.toString()
        };

        return jwt.sign(
            {
                cuentaId: datos.cuentaId,
                numeroCuenta: datos.numeroCuenta
            },
            secreto,
            opciones
        );
    }

    public verificar( token: string ): DatosToken {

        const secreto = this.obtenerSecreto();
        const contenido = jwt.verify(
            token,
            secreto
        );

        if (
            typeof contenido === "string" ||
            !this.esPayloadValido(contenido)
        ) {
            throw new Error(
                "El token no contiene datos válidos"
            );
        }

        return {

            cuentaId: contenido.cuentaId,
            numeroCuenta: contenido.numeroCuenta
        };
    }

    private obtenerSecreto(): string {
        const secreto = process.env.JWT_SECRET;

        if (!secreto) {
            throw new Error("La variable JWT_SECRET no está configurada");
        }

        return secreto;
    }

    private esPayloadValido( contenido: JwtPayload ): contenido is JwtPayload & DatosToken {
        return (
            typeof contenido.cuentaId === "number" &&
            typeof contenido.numeroCuenta === "string"
        );
    }
}