import { Evento } from "../../../Shared/Events/Evento";
import { IEventSubscriber } from "../../../Shared/Events/IEventSubscriber";
import logger from "../../../Shared/Logging/Logger";

export class HistorialSubscriber
    implements IEventSubscriber {

    public manejar(evento: Evento): void {
        logger.info(
            `[HISTORIAL] Operación disponible en el historial: ${evento.nombre}`
        );
    }
}