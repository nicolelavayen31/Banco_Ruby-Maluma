import { randomUUID } from "node:crypto";
import type { Interface } from "node:readline/promises";
import { BancoApiClient } from "../../Clients/BancoApiClient";
import { SesionCajero } from "../../Shared/SesionCajero";
import { Consola } from "../Utils/Consola";
import { Formato } from "../../Shared/Formato";
import { ICommandConsola } from "./ICommandConsola";

interface DepositoResponse {
    mensaje?: string;
    monto: number;
    saldoActual: number;
}

export class DepositarCommand implements ICommandConsola {
    public readonly nombre = "Depositar";

    constructor(
        private readonly entrada: Interface,
        private readonly apiClient: BancoApiClient,
        private readonly sesion: SesionCajero
    ) {}

    public async ejecutar(): Promise<void> {
        Consola.pantalla("DEPÓSITO");

        const textoMonto = await this.entrada.question(
            "Ingrese el monto a depositar: "
        );

        const monto = Number(textoMonto);

        if (!Number.isFinite(monto) || monto <= 0) {
            Consola.error(
                "El monto debe ser un número mayor que cero."
            );

            await this.continuar();
            return;
        }

        try {
            const respuesta =
                await this.apiClient.post<DepositoResponse>(
                    "/operaciones/depositos",
                    { monto },
                    undefined,
                    {
                        "Idempotency-Key": randomUUID()
                    }
                );

            Consola.exito(
                respuesta.mensaje ?? "Depósito realizado correctamente."
            );

            Consola.informacion(
                `Monto depositado: ${Formato.dinero(respuesta.monto)}`
            );

            Consola.informacion(
                `Saldo actual: ${Formato.dinero(
                    respuesta.saldoActual
                )}`
            );
        } catch (error) {
            Consola.error(this.obtenerMensaje(error));
        }

        await this.continuar();
    }

    private async continuar(): Promise<void> {
        await this.entrada.question(
            "\nPresione ENTER para continuar..."
        );
    }

    private obtenerMensaje(error: unknown): string {
        return error instanceof Error
            ? error.message
            : "No fue posible realizar el depósito.";
    }
}