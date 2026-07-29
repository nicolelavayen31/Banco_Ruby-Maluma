import { randomUUID } from "node:crypto";
import type { Interface } from "node:readline/promises";
import { BancoApiClient } from "../../../Clients/BancoApiClient";
import { SesionCajero } from "../../../Shared/SesionCajero";
import { Consola } from "../../Utils/Consola";
import { Formato } from "../../../Shared/Formato";
import { ICommandConsola } from "../ICommandConsola";

interface TransferenciaResponse {
    mensaje?: string;
    monto: number;
    cuentaDestino: string;
    saldoActual: number;
}

export class TransferirCommand implements ICommandConsola {
    public readonly nombre = "Transferir";

    constructor(
        private readonly entrada: Interface,
        private readonly apiClient: BancoApiClient,
        private readonly sesion: SesionCajero
    ) {}

    public async ejecutar(): Promise<void> {
        Consola.pantalla("TRANSFERENCIA");

        const cuentaDestino = (
            await this.entrada.question(
                "Número de cuenta destino: "
            )
        ).trim();

        const textoMonto =
            await this.entrada.question(
                "Monto a transferir: "
            );

        const monto = Number(textoMonto);

        if (!cuentaDestino) {
            Consola.error(
                "La cuenta de destino es obligatoria."
            );

            await this.continuar();
            return;
        }

        if (
            cuentaDestino ===
            this.sesion.obtenerNumeroCuenta()
        ) {
            Consola.error(
                "No puede transferir a su propia cuenta."
            );

            await this.continuar();
            return;
        }

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            Consola.error(
                "El monto debe ser un número mayor que cero."
            );

            await this.continuar();
            return;
        }

        try {
            const respuesta =
                await this.apiClient.post<
                    TransferenciaResponse
                >(
                    "/transferencias",
                    {
                        numeroCuentaDestino:
                            cuentaDestino,
                        monto
                    },
                    undefined,
                    {
                        "Idempotency-Key":
                            randomUUID()
                    }
                );

            Consola.exito(
                respuesta.mensaje ??
                    "Transferencia realizada correctamente."
            );

            Consola.informacion(
                `Cuenta destino: ${respuesta.cuentaDestino}`
            );

            Consola.informacion(
                `Monto transferido: ${Formato.dinero(
                    respuesta.monto
                )}`
            );

            Consola.informacion(
                `Saldo actual: ${Formato.dinero(
                    respuesta.saldoActual
                )}`
            );
        } catch (error) {
            Consola.error(
                this.obtenerMensaje(error)
            );
        }

        await this.continuar();
    }

    private async continuar(): Promise<void> {
        await this.entrada.question(
            "\nPresione ENTER para continuar..."
        );
    }

    private obtenerMensaje(
        error: unknown
    ): string {
        return error instanceof Error
            ? error.message
            : "No fue posible realizar la transferencia.";
    }
}