export class Consola {
    public static limpiar(): void {
        console.clear();
    }

    public static titulo(texto: string): void {
        console.log("===================================");
        console.log(`        ${texto}`);
        console.log("===================================\n");
    }

    public static informacion(texto: string): void {
        console.log(texto);
    }

    public static exito(texto: string): void {
        console.log(`\n ${texto}`);
    }

    public static error(texto: string): void {
        console.log(`\n ${texto}`);
    }

    public static pantalla(titulo: string): void {
        this.limpiar();
        this.titulo(titulo);
    }
}