export interface DatosSesion {
    token: string;
    numeroCuenta: string;
    titular: string;
    tipoCuenta: string;
}

export class SesionCajero {
    private datos: DatosSesion | null = null;

    public iniciar(datos: DatosSesion): void {
        this.datos = datos;
    }

    public estaActiva(): boolean {
        return this.datos !== null;
    }

    public obtenerToken(): string {
        return this.obtenerDatos().token;
    }

    public obtenerNumeroCuenta(): string {
        return this.obtenerDatos().numeroCuenta;
    }

    public obtenerTitular(): string {
        return this.obtenerDatos().titular;
    }

    public obtenerTipoCuenta(): string {
        return this.obtenerDatos().tipoCuenta;
    }

    public cerrar(): void {
        this.datos = null;
    }

    private obtenerDatos(): DatosSesion {
        if (!this.datos) {
            throw new Error("No existe una sesión activa.");
        }

        return this.datos;
    }
}