import type { Interface } from "node:readline/promises";
import { BancoApiClient } from "../../Clients/BancoApiClient";
import { SesionCajero } from "../../Shared/SesionCajero";
import { Consola } from "../Utils/Consola";
import { Formato } from "../../Shared/Formato";
import { ICommandConsola } from "./ICommandConsola";

interface CuentaResponse {
    titular: string;
    numeroCuenta: string;
    tipoCuenta: string;
    saldo: number;
}

export class ConsultarSaldoCommand implements ICommandConsola {
    public readonly nombre = "Consultar saldo";

    constructor(
        private readonly entrada: Interface,
        private readonly apiClient: BancoApiClient,
        private readonly sesion: SesionCajero
    ) {}

    public async ejecutar(): Promise<void> {
        Consola.pantalla("CONSULTA DE SALDO");

        try {
            const cuenta = await this.apiClient.get<CuentaResponse>(
                "/cuentas/me"
            );

            Consola.informacion(`Titular: ${cuenta.titular}`);
            Consola.informacion(
                `Número de cuenta: ${cuenta.numeroCuenta}`
            );
            Consola.informacion(
                `Tipo de cuenta: ${cuenta.tipoCuenta}`
            );
            Consola.informacion(
                `Saldo disponible: ${Formato.dinero(cuenta.saldo)}`
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
            : "No fue posible consultar el saldo.";
    }
}