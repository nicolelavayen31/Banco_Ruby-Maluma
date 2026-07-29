import {
    BusinessRuleError,
    TarjetaBloqueadaError
} from "../Errors/DomainErrors";
import { IPinHasher } from "../ValueObjects/IPinHasher";
import { PinTextoPlano } from "../ValueObjects/PinTextoPlano";

export class Autenticacion {
    private static readonly LIMITE_INTENTOS = 3;

    private constructor(
        private readonly id: number | undefined,
        private pinHash: string,
        private intentos: number,
        private bloqueado: boolean,
        private readonly idTarjeta: number
    ) {}

    public static crear(datos: {
        pinHash: string;
        idTarjeta: number;
    }): Autenticacion {
        return new Autenticacion(
            undefined,
            datos.pinHash,
            0,
            false,
            datos.idTarjeta
        );
    }

    public static reconstruir(datos: {
        id: number;
        pinHash: string;
        intentos: number;
        bloqueado: boolean;
        idTarjeta: number;
    }): Autenticacion {
        return new Autenticacion(
            datos.id,
            datos.pinHash,
            datos.intentos,
            datos.bloqueado,
            datos.idTarjeta
        );
    }

    public async verificarPin(
        pin: PinTextoPlano
    ): Promise<boolean> {
        if (this.bloqueado) {
            throw new TarjetaBloqueadaError(
                "La tarjeta está bloqueada por demasiados intentos fallidos"
            );
        }

        const esCorrecto =
            this.pinHash ===
            pin.valorCompleto();

        if (esCorrecto) {
            this.intentos = 0;
            return true;
        }

        this.registrarIntentoFallido();
        return false;
    }

    private registrarIntentoFallido(): void {
        this.intentos += 1;

        if (
            this.intentos >=
            Autenticacion.LIMITE_INTENTOS
        ) {
            this.bloqueado = true;
        }
    }

    public async cambiarPin(
        pinNuevo: PinTextoPlano,
        _hasher?: IPinHasher
    ): Promise<void> {
        if (this.bloqueado) {
            throw new BusinessRuleError(
                "No se puede cambiar el PIN de una tarjeta bloqueada",
                "PIN_NO_MODIFICABLE",
                403
            );
        }

        this.pinHash =
            pinNuevo.valorCompleto();
        this.intentos = 0;
    }

    public desbloquear(): void {
        this.bloqueado = false;
        this.intentos = 0;
    }

    public estaBloqueado(): boolean {
        return this.bloqueado;
    }

    public obtenerId(): number | undefined {
        return this.id;
    }

    public obtenerIntentos(): number {
        return this.intentos;
    }



    public obtenerPinHash(): string {
        return this.pinHash;
    }

    public obtenerIdTarjeta(): number {
        return this.idTarjeta;
    }
}