export class NumeroCuenta {
    private static readonly LONGITUD = 10;
    private static readonly PATRON = /^\d+$/;

    private constructor(
        private readonly valor: string
    ) {}

    public static desde(valor: string): NumeroCuenta {
        if (!NumeroCuenta.PATRON.test(valor)) {
            throw new Error(
                "El número de cuenta debe contener solo dígitos"
            );
        }

        if (valor.length !== NumeroCuenta.LONGITUD) {
            throw new Error(
                `El número de cuenta debe tener ${NumeroCuenta.LONGITUD} dígitos`
            );
        }

        return new NumeroCuenta(valor);
    }

    public static generar(
        consecutivo: number,
        prefijo = "2200"
    ): NumeroCuenta {
        const longitudDisponible =
            NumeroCuenta.LONGITUD - prefijo.length;

        const relleno = String(consecutivo).padStart(
            longitudDisponible,
            "0"
        );

        return NumeroCuenta.desde(
            prefijo + relleno
        );
    }

    public toString(): string {
        return this.valor;
    }

    public equals(otro: NumeroCuenta): boolean {
        return this.valor === otro.valor;
    }
}