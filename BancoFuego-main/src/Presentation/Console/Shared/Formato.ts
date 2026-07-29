export class Formato {
    public static dinero(monto: number): string {
        return `$${monto.toFixed(2)}`;
    }

    public static fecha(fecha: Date): string {
        return fecha.toLocaleString();
    }
}