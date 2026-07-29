import {
    TarjetaBloqueadaError,
    TarjetaVencidaError,
    ValidationError
} from "../Errors/DomainErrors";
import { NumeroTarjeta } from "../ValueObjects/NumeroTarjeta";

export class Tarjeta {
    private constructor(
        private readonly id: number | undefined,
        private readonly numeroTarjeta: NumeroTarjeta,
        private readonly fechaVencimiento: Date,
        private readonly cvv: string,
        private activa: boolean,
        private readonly idCuenta: number
    ) {}

    public static crear(datos: {
        numeroTarjeta: NumeroTarjeta;
        fechaVencimiento: Date;
        cvv: string;
        idCuenta: number;
    }): Tarjeta {
        if (!/^\d{3,4}$/.test(datos.cvv)) {
            throw new ValidationError(
                "El CVV debe tener 3 o 4 dígitos"
            );
        }

        if (datos.fechaVencimiento <= new Date()) {
            throw new ValidationError(
                "La fecha de vencimiento debe ser futura"
            );
        }

        return new Tarjeta(
            undefined,
            datos.numeroTarjeta,
            datos.fechaVencimiento,
            datos.cvv,
            true,
            datos.idCuenta
        );
    }

    public static reconstruir(datos: {
        id: number;
        numeroTarjeta: NumeroTarjeta;
        fechaVencimiento: Date;
        cvv: string;
        activa: boolean;
        idCuenta: number;
    }): Tarjeta {
        return new Tarjeta(
            datos.id,
            datos.numeroTarjeta,
            datos.fechaVencimiento,
            datos.cvv,
            datos.activa,
            datos.idCuenta
        );
    }

    public estaVencida(): boolean {
        return this.fechaVencimiento <= new Date();
    }

    public estaActiva(): boolean {
        return this.activa && !this.estaVencida();
    }

    public asegurarUsable(): void {
        if (!this.activa) {
            throw new TarjetaBloqueadaError();
        }

        if (this.estaVencida()) {
            throw new TarjetaVencidaError();
        }
    }

    public bloquear(): void {
        this.activa = false;
    }

    public reactivar(): void {
        this.activa = true;
    }

    public obtenerId(): number | undefined {
        return this.id;
    }

    public obtenerNumeroTarjeta(): NumeroTarjeta {
        return this.numeroTarjeta;
    }

    public obtenerFechaVencimiento(): Date {
        return this.fechaVencimiento;
    }

    public obtenerCvv(): string {
        return this.cvv;
    }

    public obtenerIdCuenta(): number {
        return this.idCuenta;
    }
}