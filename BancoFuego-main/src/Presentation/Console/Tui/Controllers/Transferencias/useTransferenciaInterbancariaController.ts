import { useState } from "react";
import { ServiciosTui } from "../../TuiServices";
import { MensajeTui, PantallaTui, PasoTransferenciaInterbancaria, SesionTui } from "../../TuiTypes";
import { pasoTransferenciaInterbancariaInicial } from "../../TuiState";
import { TuiMensajes } from "../../TuiMensajes";
import { TuiValidaciones } from "../../TuiValidaciones";

interface UseTransferenciaInterbancariaControllerParametros {
    servicios: ServiciosTui;
    sesion: SesionTui | null;
    actualizarSesion: (actualizador: (sesionActual: SesionTui) => SesionTui) => void;
    mostrarMensaje: (mensaje: MensajeTui, pantallaSiguiente: PantallaTui) => void;
}

export function useTransferenciaInterbancariaController(
    parametros: UseTransferenciaInterbancariaControllerParametros
) {
    const { servicios, sesion, actualizarSesion, mostrarMensaje } = parametros;
    const [codigoBancoDestino, setCodigoBancoDestino] = useState("");
    const [numeroCuentaDestino, setNumeroCuentaDestino] = useState("");
    const [montoTransferenciaInterbancaria, setMontoTransferenciaInterbancaria] = useState("");
    const [conceptoTransferencia, setConceptoTransferencia] = useState("");
    const [pasoTransferenciaInterbancaria, setPasoTransferenciaInterbancaria] =
        useState<PasoTransferenciaInterbancaria>(pasoTransferenciaInterbancariaInicial);
    const [cargandoTransferenciaInterbancaria, setCargandoTransferenciaInterbancaria] = useState(false);

    function continuar(): void {
        switch (pasoTransferenciaInterbancaria) {
            case "BANCO_DESTINO": validarBancoDestino();
            return;

            case "CUENTA_DESTINO": validarCuentaDestino();
            return;

            case "MONTO": validarMonto();
            return;

            case "CONCEPTO": void ejecutar();
            return;
        }
    }

    function validarBancoDestino(): void {
        const error = TuiValidaciones.codigoBanco(codigoBancoDestino);

        if (error) {
            mostrarError("Banco inválido", error);
            return;
        }
        setCodigoBancoDestino(codigoBancoDestino.trim());
        setPasoTransferenciaInterbancaria("CUENTA_DESTINO");
    }

    function validarCuentaDestino(): void {
        const error = TuiValidaciones.cuentaDestino(numeroCuentaDestino);

        if (error) {
            mostrarError("Cuenta inválida", error);
            return;
        }

        setNumeroCuentaDestino(numeroCuentaDestino.trim());
        setMontoTransferenciaInterbancaria("");
        setPasoTransferenciaInterbancaria("MONTO");
    }

    function validarMonto(): void {
        if (obtenerMontoValidado() === null) {
            mostrarMontoInvalido();
            return;
        }
        setPasoTransferenciaInterbancaria("CONCEPTO");
    }

    async function ejecutar(): Promise<void> {
        if (!sesion) {
            mostrarMensaje(
                TuiMensajes.error("Sesión inválida", "No existe una sesión activa."),
                "LOGIN_TARJETA"
            );
            return;
        }

        const monto = obtenerMontoValidado();

        if (monto === null) {
            mostrarMontoInvalido();
            return;
        }

        const numeroDestino = numeroCuentaDestino.trim();
        const bancoDestino = codigoBancoDestino.trim();
        const concepto = conceptoTransferencia.trim();

        setCargandoTransferenciaInterbancaria(true);

        try {
            const resultado = await servicios.transferenciaService.ejecutar({
                tipoTransferencia: "INTERBANCARIA",
                cuentaOrigenId: sesion.cuentaId,
                numeroCuentaDestino: numeroDestino,
                codigoBancoDestino: bancoDestino,
                monto,
                concepto: concepto || undefined,
                correoCliente: sesion.correoCliente
            });

            const nuevoSaldo = resultado.origen.saldoNuevo;

            actualizarSesion(sesionActual => ({
                ...sesionActual,
                saldo: nuevoSaldo
            }));

            limpiar();

            mostrarMensaje(
                TuiMensajes.exito(
                    "Transferencia interbancaria en proceso",
                    construirMensajeExito(monto, numeroDestino, bancoDestino, concepto, nuevoSaldo)
                ),
                "MENU_PRINCIPAL"
            );
        } catch (error: unknown) {
            mostrarMensaje(
                TuiMensajes.desdeError(
                    "Error en transferencia interbancaria",
                    error,
                    "No se pudo procesar la transferencia interbancaria."
                ),
                "TRANSFERENCIA_INTERBANCARIA"
            );
        } finally {
            setCargandoTransferenciaInterbancaria(false);
        }
    }

    function obtenerMontoValidado(): number | null {
        return TuiValidaciones.monto(montoTransferenciaInterbancaria);
    }

    function mostrarMontoInvalido(): void {
        mostrarError("Monto inválido", "Ingrese un monto superior a 0.");
    }

    function mostrarError(titulo: string, detalle: string): void {
        mostrarMensaje(TuiMensajes.error(titulo, detalle), "TRANSFERENCIA_INTERBANCARIA");
    }

    function construirMensajeExito(
        monto: number,
        numeroDestino: string,
        bancoDestino: string,
        concepto: string,
        nuevoSaldo: number
    ): string {
        const detalleConcepto = concepto ? `\nConcepto: ${concepto}` : "";

        return `Se enviaron $${monto.toFixed(2)} a la cuenta ${numeroDestino} del banco ${bancoDestino}.${detalleConcepto}\nNuevo saldo: $${nuevoSaldo.toFixed(2)}`;
    }

    function limpiar(): void {
        setCodigoBancoDestino("");
        setNumeroCuentaDestino("");
        setMontoTransferenciaInterbancaria("");
        setConceptoTransferencia("");
        setPasoTransferenciaInterbancaria(pasoTransferenciaInterbancariaInicial);
        setCargandoTransferenciaInterbancaria(false);
    }

    return {
        codigoBancoDestino,
        numeroCuentaDestino,
        montoTransferenciaInterbancaria,
        conceptoTransferencia,
        pasoTransferenciaInterbancaria,
        cargandoTransferenciaInterbancaria,
        setCodigoBancoDestino,
        setNumeroCuentaDestino,
        setMontoTransferenciaInterbancaria,
        setConceptoTransferencia,
        continuar,
        ejecutar,
        limpiar
    };
}

export type TransferenciaInterbancariaController = ReturnType<typeof useTransferenciaInterbancariaController>;