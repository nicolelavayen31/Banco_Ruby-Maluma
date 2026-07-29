export class NumeroTarjeta {
    private static readonly LONGITUD = 16;
    private static readonly PATRON = /^\d{16}$/;

    private static readonly VALIDAR_CHECKSUM =
        process.env.VALIDAR_LUHN_TARJETA === "true";

    private constructor(
        private readonly valor: string
    ) {}

    public static desde(valor: string): NumeroTarjeta {
        const valorNormalizado =
            valor.replace(/[\s-]/g, "");

        if (!NumeroTarjeta.PATRON.test(valorNormalizado)) {
            throw new Error(
                `El número de tarjeta debe tener exactamente ${NumeroTarjeta.LONGITUD} dígitos`
            );
        }

        if (
            NumeroTarjeta.VALIDAR_CHECKSUM &&
            !NumeroTarjeta.pasaLuhn(valorNormalizado)
        ) {
            throw new Error(
                "El número de tarjeta no es válido"
            );
        }

        return new NumeroTarjeta(valorNormalizado);
    }

    private static pasaLuhn(numero: string): boolean {
        let suma = 0;
        let esSegundoDigito = false;

        for (let indice = numero.length - 1; indice >= 0; indice--) {
            let digito = Number(numero[indice]);

            if (esSegundoDigito) {
                digito *= 2;

                if (digito > 9) {
                    digito -= 9;
                }
            }

            suma += digito;
            esSegundoDigito = !esSegundoDigito;
        }

        return suma % 10 === 0;
    }

    public valorCompleto(): string {
        return this.valor;
    }

    public enmascarado(): string {
        return "*".repeat(this.valor.length - 4)
            + this.valor.slice(-4);
    }

    public toString(): string {
        return this.enmascarado();
    }

    public equals(otro: NumeroTarjeta): boolean {
        return this.valor === otro.valor;
    }
}