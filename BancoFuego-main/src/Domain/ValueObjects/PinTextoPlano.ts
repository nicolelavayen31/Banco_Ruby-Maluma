export class PinTextoPlano {
    private static readonly PATRON = /^\d{4}$/;

    private constructor(
        private readonly valor: string
    ) {}

    public static desde(valor: string): PinTextoPlano {
        if (!PinTextoPlano.PATRON.test(valor)) {
            throw new Error(
                "El PIN debe tener exactamente 4 dígitos numéricos"
            );
        }

        return new PinTextoPlano(valor);
    }

    public valorCompleto(): string {
        return this.valor;
    }

    public toString(): string {
        return "****";
    }
}