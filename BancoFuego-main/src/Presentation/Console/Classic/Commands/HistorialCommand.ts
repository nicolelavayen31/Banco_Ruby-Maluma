import type { Interface } from "node:readline/promises";
import { BancoApiClient } from "../../Clients/BancoApiClient";
import { SesionCajero } from "../../Shared/SesionCajero";
import { Consola } from "../Utils/Consola";
import { Formato } from "../../Shared/Formato";
import { ICommandConsola } from "./ICommandConsola";

interface TransaccionResponse {
    id: string | number;
    fecha: string;
    tipo: string;
    monto: number;
    naturaleza?: string;
    estado?: string;
}

export class HistorialCommand implements ICommandConsola {
    public readonly nombre = "Ver historial";

    constructor(
        private readonly entrada: Interface,
        private readonly apiClient: BancoApiClient,
        private readonly sesion: SesionCajero
    ) {}

    public async ejecutar(): Promise<void> {
        Consola.pantalla("HISTORIAL DE TRANSACCIONES");

        try {
            const transacciones =
                await this.apiClient.get<TransaccionResponse[]>(
                    "/historial/me"
                );

            if (transacciones.length === 0) {
                Consola.informacion(
                    "No existen transacciones registradas."
                );

                await this.continuar();
                return;
            }

            for (const transaccion of transacciones) {
                Consola.informacion(
                    `\nID: ${transaccion.id}`
                );

                Consola.informacion(
                    `Fecha: ${this.formatearFecha(
                        transaccion.fecha
                    )}`
                );

                Consola.informacion(
                    `Tipo: ${transaccion.tipo}`
                );

                Consola.informacion(
                    `Monto: ${Formato.dinero(
                        transaccion.monto
                    )}`
                );

                if (transaccion.naturaleza) {
                    Consola.informacion(
                        `Naturaleza: ${transaccion.naturaleza}`
                    );
                }

                if (transaccion.estado) {
                    Consola.informacion(
                        `Estado: ${transaccion.estado}`
                    );
                }

                Consola.informacion(
                    "-----------------------------------"
                );
            }
        } catch (error) {
            Consola.error(this.obtenerMensaje(error));
        }

        await this.continuar();
    }

    private formatearFecha(fecha: string): string {
        const fechaConvertida = new Date(fecha);

        if (Number.isNaN(fechaConvertida.getTime())) {
            return fecha;
        }

        return fechaConvertida.toLocaleString("es-EC");
    }

    private async continuar(): Promise<void> {
        await this.entrada.question(
            "\nPresione ENTER para continuar..."
        );
    }

    private obtenerMensaje(error: unknown): string {
        return error instanceof Error
            ? error.message
            : "No fue posible consultar el historial.";
    }
}