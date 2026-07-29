import { Evento } from "../../../Shared/Events/Evento";
import { IEventSubscriber } from "../../../Shared/Events/IEventSubscriber";
import logger from "../../../Shared/Logging/Logger";

export class LogSubscriber
    implements IEventSubscriber {

    public manejar(evento: Evento): void {
        logger.info(
            `[EVENTO] Evento recibido: ${evento.nombre}`
        );
    }
}