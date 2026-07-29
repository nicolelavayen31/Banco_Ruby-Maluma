import { Evento } from "./Evento";

export interface IEventSubscriber<T = unknown> {
    manejar(evento: Evento<T>): void;
}