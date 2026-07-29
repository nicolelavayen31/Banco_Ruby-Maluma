import { useState } from "react";
import { ServiciosTui } from "../TuiServices";
import { MensajeTui, PantallaTui, SesionTui } from "../TuiTypes";
import { TuiMensajes } from "../TuiMensajes";
import { TuiValidaciones } from "../TuiValidaciones";
import { errorCoincide, obtenerMensajeError } from "../TuiErrorUtils";

interface UseAutenticacionControllerParametros {
    servicios: ServiciosTui;
    cambiarPantalla: (pantalla: PantallaTui) => void;
    mostrarMensaje: (mensaje: MensajeTui, pantallaSiguiente: PantallaTui) => void;
}

export function useAutenticacionController(parametros: UseAutenticacionControllerParametros) {
    const { servicios, cambiarPantalla, mostrarMensaje } = parametros;
    const [numeroTarjeta, setNumeroTarjeta] = useState("");
    const [pin, setPin] = useState("");
    const [sesion, setSesion] = useState<SesionTui | null>(null);
    const [cargandoAutenticacion, setCargandoAutenticacion] = useState(false);
    function continuarTarjeta(): void {

        const error = TuiValidaciones.tarjeta(numeroTarjeta);
        if (error) {
            mostrarMensaje(TuiMensajes.error("Número de tarjeta inválido", error), "LOGIN_TARJETA");
            return;
        }
        setPin("");
        cambiarPantalla("LOGIN_PIN");
    }
    async function autenticar(): Promise<void> {
        setCargandoAutenticacion(true);
        try {
            const resultado = await servicios.autenticacionService.autenticar({
                numeroTarjeta: numeroTarjeta.trim(),
                pin
            });
            setSesion(resultado);
            setPin("");
            cambiarPantalla("MENU_PRINCIPAL");
        } catch (error: unknown) {
            manejarErrorAutenticacion(error);
        } finally {
            setCargandoAutenticacion(false);
        }
    }

    function manejarErrorAutenticacion(error: unknown): void {
        const mensajeError = obtenerMensajeError(error);
        const tarjetaBloqueada = errorCoincide(error, "TarjetaBloqueadaError", "bloqueada");
        const tarjetaNoEncontrada = errorCoincide(error, "TarjetaNoEncontradaError", "no encontrada");
        let pantallaSiguiente: PantallaTui = "LOGIN_PIN";
        let titulo = "PIN incorrecto";
        let contenido = mensajeError || "El PIN ingresado es incorrecto.";
        if (tarjetaBloqueada) {
            titulo = "Tarjeta bloqueada";
            contenido = "La tarjeta fue bloqueada por acumular tres intentos fallidos. Acude a una agencia bancaria.";
            pantallaSiguiente = "LOGIN_TARJETA";
            setNumeroTarjeta("");
        } else if (tarjetaNoEncontrada) {
            titulo = "Tarjeta no registrada";
            contenido = "El número de tarjeta ingresado no existe en el sistema bancario.";
            pantallaSiguiente = "LOGIN_TARJETA";
            setNumeroTarjeta("");
        }
        setPin("");
        mostrarMensaje(TuiMensajes.error(titulo, contenido), pantallaSiguiente);
    }

    function actualizarSesion(actualizador: (sesionActual: SesionTui) => SesionTui): void {
        setSesion(sesionActual => sesionActual ? actualizador(sesionActual) : null);
    }
    function cerrarSesion(): void {
        setSesion(null);
        setNumeroTarjeta("");
        setPin("");
    }
    function reiniciarAutenticacion(): void {
        cerrarSesion();
        cambiarPantalla("LOGIN_TARJETA");
    }
    return {
        numeroTarjeta,
        pin,
        sesion,
        cargandoAutenticacion,
        setNumeroTarjeta,
        setPin,
        continuarTarjeta,
        autenticar,
        actualizarSesion,
        cerrarSesion,
        reiniciarAutenticacion
    };
}

export type AutenticacionController = ReturnType<typeof useAutenticacionController>;