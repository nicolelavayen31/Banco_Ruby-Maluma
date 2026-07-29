import logger from "../Logging/Logger";
import { Evento } from "./Evento";

type CallbackEvento = (evento: Evento) => void;

export class EventBus {
    private readonly suscriptores:
        Map<string, CallbackEvento[]> = new Map();

    public suscribir(
        nombreEvento: string,
        callback: CallbackEvento
    ): void {
        const lista = this.suscriptores.get(nombreEvento);

        if (lista) {
            lista.push(callback);
            return;
        }

        this.suscriptores.set(nombreEvento, [callback]);
    }

    public publicar(evento: Evento): void {
        const lista = this.suscriptores.get(evento.nombre);

        if (!lista) {
            return;
        }

        for (const callback of lista) {
            try {
                callback(evento);
            } catch (error) {
                const mensaje =
                    error instanceof Error
                        ? error.message
                        : "Error desconocido";

                logger.error(
                    `No fue posible ejecutar un suscriptor del evento ${evento.nombre}: ${mensaje}`
                );
            }
        }
    }
}