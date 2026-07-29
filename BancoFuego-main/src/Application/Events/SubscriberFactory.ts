import { EventBus } from "../../Shared/Events/EventBus";
import { TiposEvento } from "./TiposEvento";
import { AuditoriaSubscriber } from "./Subscribers/AuditoriaSubscriber";
import { CorreoSubscriber } from "./Subscribers/CorreoSubscriber";
import { HistorialSubscriber } from "./Subscribers/HistorialSubscriber";
import { LogSubscriber } from "./Subscribers/LogSubscriber";

export class SubscriberFactory {
    public static crear(
        eventBus: EventBus
    ): void {
        const historialSubscriber =
            new HistorialSubscriber();

        const logSubscriber =
            new LogSubscriber();

        const auditoriaSubscriber =
            new AuditoriaSubscriber();

        const correoSubscriber =
            new CorreoSubscriber();

        const eventos = [
            TiposEvento.DEPOSITO_REALIZADO,
            TiposEvento.RETIRO_REALIZADO,
            TiposEvento.TRANSFERENCIA_REALIZADA,
            TiposEvento.LOGIN_REALIZADO
        ];

        for (const nombreEvento of eventos) {
            eventBus.suscribir(
                nombreEvento,
                evento =>
                    historialSubscriber.manejar(evento)
            );

            eventBus.suscribir(
                nombreEvento,
                evento =>
                    logSubscriber.manejar(evento)
            );

            eventBus.suscribir(
                nombreEvento,
                evento =>
                    auditoriaSubscriber.manejar(evento)
            );

            eventBus.suscribir(
                nombreEvento,
                evento =>
                    correoSubscriber.manejar(evento)
            );
        }
    }
}