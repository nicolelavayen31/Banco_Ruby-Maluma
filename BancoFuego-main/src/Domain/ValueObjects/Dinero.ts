export class Dinero {
    private constructor(
        private readonly centavos: number
    ) {}

    public static desde(monto: number): Dinero {
        if (!Number.isFinite(monto)) {
            throw new Error(
                "El monto debe ser un número finito"
            );
        }

        const centavos = Math.round(monto * 100);

        return new Dinero(centavos);
    }

    public static cero(): Dinero {
        return new Dinero(0);
    }

    public sumar(otro: Dinero): Dinero {
        return new Dinero(
            this.centavos + otro.centavos
        );
    }

    public restar(otro: Dinero): Dinero {
        return new Dinero(
            this.centavos - otro.centavos
        );
    }

    public esMayorOIgualQue(otro: Dinero): boolean {
        return this.centavos >= otro.centavos;
    }

    public esMayorQue(otro: Dinero): boolean {
        return this.centavos > otro.centavos;
    }

    public esMenorQue(otro: Dinero): boolean {
        return this.centavos < otro.centavos;
    }

    public esPositivo(): boolean {
        return this.centavos > 0;
    }

    public toNumber(): number {
        return this.centavos / 100;
    }

    public toString(): string {
        return this.toNumber().toFixed(2);
    }

    public equals(otro: Dinero): boolean {
        return this.centavos === otro.centavos;
    }
}