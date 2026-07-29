import type { Interface } from "node:readline/promises";
import { ICommandConsola } from "../Commands/ICommandConsola";
import { SesionCajero } from "../../Shared/SesionCajero";
import { Consola } from "../Utils/Consola";

export class MainMenu {
    constructor(
        private readonly entrada: Interface,
        private readonly sesion: SesionCajero,
        private readonly comandos: Map<string, ICommandConsola>
    ) {}

    public async ejecutar(): Promise<void> {
        let continuar = true;

        while (continuar && this.sesion.estaActiva()) {
            this.mostrarEncabezado();
            this.mostrarOpciones();

            const opcion = (
                await this.entrada.question("Seleccione una opción: ")
            ).trim();

            if (opcion === "6") {
                continuar = false;
                this.sesion.cerrar();

                Consola.exito("Sesión cerrada correctamente.");
                continue;
            }

            const comando = this.comandos.get(opcion);

            if (!comando) {
                Consola.error("La opción seleccionada no es válida.");
                await this.pausar();
                continue;
            }

            await comando.ejecutar();
        }
    }

    private mostrarEncabezado(): void {
        Consola.pantalla("CAJERO AUTOMÁTICO");

        Consola.informacion(
            `Titular: ${this.sesion.obtenerTitular()}`
        );

        Consola.informacion(
            `Número de cuenta: ${this.sesion.obtenerNumeroCuenta()}`
        );

        Consola.informacion(
            `Tipo de cuenta: ${this.sesion.obtenerTipoCuenta()}`
        );

        Consola.informacion("");
    }

    private mostrarOpciones(): void {
        Consola.informacion("1. Consultar saldo");
        Consola.informacion("2. Depositar");
        Consola.informacion("3. Retirar");
        Consola.informacion("4. Transferir");
        Consola.informacion("5. Ver historial");
        Consola.informacion("6. Cerrar sesión");
        Consola.informacion("");
    }

    private async pausar(): Promise<void> {
        await this.entrada.question(
            "\nPresione ENTER para continuar..."
        );
    }
}