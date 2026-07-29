export interface ICommandConsola {
    readonly nombre: string;
    ejecutar(): Promise<void>;
}