import { useState } from "react";
import { useInput } from "ink";
import {
    mensajeInicial,
    pantallaInicial
} from "../TuiState";
import {
    MensajeTui,
    PantallaTui
} from "../TuiTypes";

const PANTALLAS_CANCELABLES: PantallaTui[] = [
    "DEPOSITO",
    "RETIRO",
    "CAMBIAR_PIN",
    "TRANSFERENCIA_LOCAL",
    "TRANSFERENCIA_INTERBANCARIA"
];

export function useNavegacionController() {
    const [
        pantalla,
        setPantalla
    ] = useState<PantallaTui>(
        pantallaInicial
    );

    const [
        mensaje,
        setMensaje
    ] = useState<MensajeTui>(
        mensajeInicial
    );

    const [
        pantallaSiguiente,
        setPantallaSiguiente
    ] = useState<PantallaTui>(
        pantallaInicial
    );

    const [
        pantallaPreviaCancelacion,
        setPantallaPreviaCancelacion
    ] = useState<PantallaTui | null>(
        null
    );

    useInput((_entrada, tecla) => {
        if (!tecla.escape) {
            return;
        }

        if (
            !PANTALLAS_CANCELABLES.includes(
                pantalla
            )
        ) {
            return;
        }

        setPantallaPreviaCancelacion(
            pantalla
        );

        setPantalla(
            "CONFIRMAR_CANCELACION"
        );
    });

    function cambiarPantalla(
        nuevaPantalla: PantallaTui
    ): void {
        setPantalla(
            nuevaPantalla
        );
    }

    function mostrarMensaje(
        nuevoMensaje: MensajeTui,
        siguiente: PantallaTui
    ): void {
        setMensaje(
            nuevoMensaje
        );

        setPantallaSiguiente(
            siguiente
        );

        setPantalla(
            "MENSAJE"
        );
    }

    function continuarMensaje(): void {
        setPantalla(
            pantallaSiguiente
        );
    }

    function regresarAlMenu(): void {
        setPantalla(
            "MENU_PRINCIPAL"
        );
    }

    function abrirConfirmacionSalida(): void {
        setPantalla(
            "CONFIRMAR_SALIDA"
        );
    }

    function abrirDespedida(): void {
        setPantalla(
            "DESPEDIDA"
        );
    }

    function regresarAlInicio(): void {
        setPantalla(
            "LOGIN_TARJETA"
        );
    }

    function confirmarCancelacion(
        limpiarOperacion: () => void
    ): void {
        limpiarOperacion();

        setPantallaPreviaCancelacion(
            null
        );

        setPantalla(
            "MENU_PRINCIPAL"
        );
    }

    function rechazarCancelacion(): void {
        setPantalla(
            pantallaPreviaCancelacion ??
                "MENU_PRINCIPAL"
        );

        setPantallaPreviaCancelacion(
            null
        );
    }

    return {
        pantalla,
        mensaje,
        pantallaSiguiente,
        pantallaPreviaCancelacion,

        cambiarPantalla,
        mostrarMensaje,
        continuarMensaje,
        regresarAlMenu,
        abrirConfirmacionSalida,
        abrirDespedida,
        regresarAlInicio,
        confirmarCancelacion,
        rechazarCancelacion
    };
}

export type NavegacionController =
    ReturnType<
        typeof useNavegacionController
    >;