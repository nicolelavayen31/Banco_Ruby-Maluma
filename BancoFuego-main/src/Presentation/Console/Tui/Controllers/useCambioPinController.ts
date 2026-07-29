import { useState } from "react";
import { ServiciosTui } from "../TuiServices";
import { MensajeTui, PantallaTui, PasoCambioPin } from "../TuiTypes";
import { pasoPinInicial } from "../TuiState";
import { TuiMensajes } from "../TuiMensajes";
import { TuiValidaciones } from "../TuiValidaciones";
import { errorCoincide } from "../TuiErrorUtils";

interface UseCambioPinControllerParametros {
    servicios: ServiciosTui;
    numeroTarjeta: string;
    cambiarPantalla: (pantalla: PantallaTui) => void;
    mostrarMensaje: (mensaje: MensajeTui, pantallaSiguiente: PantallaTui) => void;
}

export function useCambioPinController(parametros: UseCambioPinControllerParametros) {
   
    const { servicios, numeroTarjeta, cambiarPantalla, mostrarMensaje } = parametros;
    const [pinActual, setPinActual] = useState("");
    const [pinNuevo, setPinNuevo] = useState("");
    const [pasoCambioPin, setPasoCambioPin] = useState<PasoCambioPin>(pasoPinInicial);
    const [cargandoCambioPin, setCargandoCambioPin] = useState(false);

    function iniciarCambioPin(): void {
        limpiar();
        cambiarPantalla("CAMBIAR_PIN");
    }

    function continuar(): void {
        if (pasoCambioPin === "PIN_ACTUAL") {
            validarPinActual();
            return;
        }

        void ejecutarCambioPin();
    }

    function validarPinActual(): void {
        if (!/^\d{4}$/.test(pinActual)) {
            mostrarMensaje(
                TuiMensajes.error("PIN inválido", "El PIN actual debe tener exactamente 4 dígitos numéricos."),
                "CAMBIAR_PIN"
            );
            return;
        }

        setPasoCambioPin("PIN_NUEVO");
    }

    async function ejecutarCambioPin(): Promise<void> {

        const errorPinNuevo = TuiValidaciones.pinNuevo(pinNuevo);
        if (errorPinNuevo) {
            mostrarMensaje(TuiMensajes.error("PIN inválido", errorPinNuevo), "CAMBIAR_PIN");
            return;
        }
        setCargandoCambioPin(true);

        try {
            await servicios.autenticacionService.cambiarPin({
                numeroTarjeta,
                pinActual,
                pinNuevo
            });

            limpiar();
            mostrarMensaje(
                TuiMensajes.exito("PIN cambiado", "Su clave secreta fue actualizada correctamente."),
                "MENU_PRINCIPAL"
            );
        } catch (error: unknown) {
            const tarjetaBloqueada = errorCoincide(error, "TarjetaBloqueadaError", "bloqueada");

            limpiar();
            mostrarMensaje(
                TuiMensajes.desdeError(
                    tarjetaBloqueada ? "Tarjeta bloqueada" : "Error al cambiar PIN",
                    error,
                    "No se pudo cambiar el PIN."
                ),
                tarjetaBloqueada ? "LOGIN_TARJETA" : "MENU_PRINCIPAL"
            );
        } finally {
            setCargandoCambioPin(false);
        }
    }

    function limpiar(): void {
        setPinActual("");
        setPinNuevo("");
        setPasoCambioPin(pasoPinInicial);
        setCargandoCambioPin(false);
    }

    return {
        pinActual,
        pinNuevo,
        pasoCambioPin,
        cargandoCambioPin,
        setPinActual,
        setPinNuevo,
        iniciarCambioPin,
        continuar,
        ejecutarCambioPin,
        limpiar
    };
}
export type CambioPinController = ReturnType<typeof useCambioPinController>;