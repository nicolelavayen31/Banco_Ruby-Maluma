import { Evento } from "../../../Shared/Events/Evento";
import { IEventSubscriber } from "../../../Shared/Events/IEventSubscriber";
import logger from "../../../Shared/Logging/Logger";

export class AuditoriaSubscriber
    implements IEventSubscriber {

    public manejar(evento: Evento): void {
        logger.info(
            `[AUDITORÍA] Operación registrada: ${evento.nombre}`
        );
    }
}