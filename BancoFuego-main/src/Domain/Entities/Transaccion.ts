import { EstadoTransaccion } from "../Enums/EstadoTransaccion";
import { TipoTransaccion } from "../Enums/TipoTransaccion";
import { Dinero } from "../ValueObjects/Dinero";

export class Transaccion {
    private constructor(
        private readonly id: number | undefined,
        private readonly tipo: TipoTransaccion,
        private readonly monto: Dinero,
        private estado: EstadoTransaccion,
        private readonly fecha: Date,
        private readonly descripcion: string | undefined,
        private readonly idCajero: number | undefined,
        private referenciaExterna: string | undefined,
        private estadoDetalle: string | undefined,
        private actualizadoEn: Date
    ) {}

    public static crear(datos: {
        tipo: TipoTransaccion;
        monto: Dinero;
        estado?: EstadoTransaccion;
        descripcion?: string;
        idCajero?: number;
        referenciaExterna?: string;
        estadoDetalle?: string;
        actualizadoEn?: Date;
    }): Transaccion {
        const fecha = new Date();

        return new Transaccion(
            undefined,
            datos.tipo,
            datos.monto,
            datos.estado ?? "EXITOSA",
            fecha,
            datos.descripcion,
            datos.idCajero,
            datos.referenciaExterna,
            datos.estadoDetalle,
            datos.actualizadoEn ?? fecha
        );
    }

    public static reconstruir(datos: {
        id: number;
        tipo: TipoTransaccion;
        monto: Dinero;
        estado: EstadoTransaccion;
        fecha: Date;
        descripcion?: string;
        idCajero?: number;
        referenciaExterna?: string;
        estadoDetalle?: string;
        actualizadoEn?: Date;
    }): Transaccion {
        return new Transaccion(
            datos.id,
            datos.tipo,
            datos.monto,
            datos.estado,
            datos.fecha,
            datos.descripcion,
            datos.idCajero,
            datos.referenciaExterna,
            datos.estadoDetalle,
            datos.actualizadoEn ?? datos.fecha
        );
    }

    public marcarPendiente(
        referenciaExterna: string,
        detalle?: string
    ): void {
        this.estado = "PENDIENTE";
        this.referenciaExterna = referenciaExterna;
        this.estadoDetalle = detalle;
        this.actualizadoEn = new Date();
    }

    public marcarExitosa(
        referenciaExterna?: string,
        detalle?: string
    ): void {
        this.estado = "EXITOSA";

        if (referenciaExterna) {
            this.referenciaExterna = referenciaExterna;
        }

        this.estadoDetalle = detalle;
        this.actualizadoEn = new Date();
    }

    public marcarFallida(detalle?: string): void {
        this.estado = "FALLIDA";
        this.estadoDetalle = detalle;
        this.actualizadoEn = new Date();
    }

    public cancelar(detalle?: string): void {
        this.estado = "CANCELADA";
        this.estadoDetalle = detalle;
        this.actualizadoEn = new Date();
    }

    public esPendiente(): boolean {
        return this.estado === "PENDIENTE";
    }

    public esExitosa(): boolean {
        return this.estado === "EXITOSA";
    }

    public esFallida(): boolean {
        return this.estado === "FALLIDA";
    }

    public obtenerId(): number | undefined {
        return this.id;
    }

    public obtenerTipo(): TipoTransaccion {
        return this.tipo;
    }

    public obtenerMonto(): Dinero {
        return this.monto;
    }

    public obtenerEstado(): EstadoTransaccion {
        return this.estado;
    }

    public obtenerFecha(): Date {
        return this.fecha;
    }

    public obtenerDescripcion(): string | undefined {
        return this.descripcion;
    }

    public obtenerIdCajero(): number | undefined {
        return this.idCajero;
    }

    public obtenerReferenciaExterna(): string | undefined {
        return this.referenciaExterna;
    }

    public obtenerEstadoDetalle(): string | undefined {
        return this.estadoDetalle;
    }

    public obtenerActualizadoEn(): Date {
        return this.actualizadoEn;
    }
}