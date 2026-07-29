export class Evento <T = unknown> {
    constructor(
        public readonly nombre: string,
        public readonly datos: T,
        public readonly fecha: Date = new Date()
    ){}
}