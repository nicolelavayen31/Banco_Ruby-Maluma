export class Cliente {
    private static readonly PATRON_CEDULA = /^\d{10}$/;

    private constructor(
        private readonly id: number | undefined,
        private readonly cedula: string,
        private nombres: string,
        private apellidos: string,
        private telefono: string | undefined,
        private correo: string | undefined,
        private direccion: string | undefined,
        private readonly fechaRegistro: Date,
        private activo: boolean
    ) {}

    public static crear(datos: {
        cedula: string;
        nombres: string;
        apellidos: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
    }): Cliente {
        if (!Cliente.PATRON_CEDULA.test(datos.cedula)) {
            throw new Error(
                "La cédula debe tener exactamente 10 dígitos"
            );
        }

        if (!datos.nombres.trim() || !datos.apellidos.trim()) {
            throw new Error(
                "Los nombres y apellidos son obligatorios"
            );
        }

        return new Cliente(
            undefined,
            datos.cedula,
            datos.nombres,
            datos.apellidos,
            datos.telefono,
            datos.correo,
            datos.direccion,
            new Date(),
            true
        );
    }

    public static reconstruir(datos: {
        id: number;
        cedula: string;
        nombres: string;
        apellidos: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
        fechaRegistro: Date;
        activo: boolean;
    }): Cliente {
        return new Cliente(
            datos.id,
            datos.cedula,
            datos.nombres,
            datos.apellidos,
            datos.telefono,
            datos.correo,
            datos.direccion,
            datos.fechaRegistro,
            datos.activo
        );
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

    public nombreCompleto(): string {
        return `${this.nombres} ${this.apellidos}`;
    }

    public obtenerId(): number | undefined {
        return this.id;
    }

    public obtenerCedula(): string {
        return this.cedula;
    }

    public obtenerNombres(): string {
        return this.nombres;
    }

    public obtenerApellidos(): string {
        return this.apellidos;
    }

    public obtenerTelefono(): string | undefined {
        return this.telefono;
    }

    public obtenerCorreo(): string | undefined {
        return this.correo;
    }

    public obtenerDireccion(): string | undefined {
        return this.direccion;
    }

    public obtenerFechaRegistro(): Date {
        return this.fechaRegistro;
    }
}
