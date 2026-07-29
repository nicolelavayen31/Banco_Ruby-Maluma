export class Cajero {
    private constructor(
        private readonly id: number | undefined,
        private readonly codigo: string,
        private ubicacion: string | undefined,
        private activo: boolean,
        private readonly idBanco: number
    ) {}

    public static crear(datos: {
        codigo: string;
        ubicacion?: string;
        idBanco: number;
    }): Cajero {
        if (!/^[A-Z0-9]{2,20}$/.test(datos.codigo)) {
            throw new Error(
                "El código del cajero debe ser alfanumérico en mayúsculas (2-20 caracteres)"
            );
        }

        return new Cajero(
            undefined,
            datos.codigo,
            datos.ubicacion,
            true,
            datos.idBanco
        );
    }

    public static reconstruir(datos: {
        id: number;
        codigo: string;
        ubicacion?: string;
        activo: boolean;
        idBanco: number;
    }): Cajero {
        return new Cajero(
            datos.id,
            datos.codigo,
            datos.ubicacion,
            datos.activo,
            datos.idBanco
        );
    }

    public asegurarOperativo(): void {
        if (!this.activo) {
            throw new Error(
                `El cajero ${this.codigo} está fuera de servicio`
            );
        }
    }

    public activar(): void {
        this.activo = true;
    }

    public desactivar(): void {
        this.activo = false;
    }

    public estaActivo(): boolean {
        return this.activo;
    }

    public obtenerId(): number | undefined {
        return this.id;
    }

    public obtenerCodigo(): string {
        return this.codigo;
    }

    public obtenerUbicacion(): string | undefined {
        return this.ubicacion;
    }

    public obtenerIdBanco(): number {
        return this.idBanco;
    }
}