export class TuiValidaciones {
    public static tarjeta(
        numeroTarjeta: string
    ): string | null {
        const tarjetaLimpia =
            numeroTarjeta.trim();

        if (tarjetaLimpia.length < 16) {
            return "El número de tarjeta debe tener al menos 16 dígitos.";
        }

        return null;
    }

    public static monto(
        valor: string
    ): number | null {
        const monto =
            Number(valor);

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            return null;
        }

        return monto;
    }

    public static cuentaDestino(
        numeroCuenta: string
    ): string | null {
        if (
            numeroCuenta.trim().length < 5
        ) {
            return "Ingrese un número de cuenta destino válido.";
        }

        return null;
    }

    public static codigoBanco(
        codigoBanco: string
    ): string | null {
        if (
            codigoBanco.trim().length === 0
        ) {
            return "El código del banco destino es obligatorio.";
        }

        return null;
    }

    public static pinNuevo(
        pin: string
    ): string | null {
        if (!/^\d{4}$/.test(pin)) {
            return "El nuevo PIN debe tener exactamente 4 dígitos numéricos.";
        }

        return null;
    }
}