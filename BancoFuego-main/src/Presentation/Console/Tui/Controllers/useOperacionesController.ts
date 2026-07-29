import { useState } from "react";
import { ServiciosTui } from "../TuiServices";
import { HistorialItemTui, MensajeTui, PantallaTui, SesionTui } from "../TuiTypes";
import { TuiMensajes } from "../TuiMensajes";
import { TuiValidaciones } from "../TuiValidaciones";

interface UseOperacionesControllerParametros {
    servicios: ServiciosTui;
    sesion: SesionTui | null;
    actualizarSesion: (actualizador: (sesionActual: SesionTui) => SesionTui) => void;
    cambiarPantalla: (pantalla: PantallaTui) => void;
    mostrarMensaje: (mensaje: MensajeTui, pantallaSiguiente: PantallaTui) => void;
}

interface ResultadoOperacionMonto {
    saldoNuevo: number;
}

interface ConfiguracionOperacionMonto {
    pantalla: "DEPOSITO" | "RETIRO";
    tituloExito: string;
    tituloError: string;
    mensajeError: string;
    ejecutar: (cuentaId: number, monto: number, correoCliente?: string) => Promise<ResultadoOperacionMonto>;
}

export function useOperacionesController(parametros: UseOperacionesControllerParametros) {
    const { servicios, sesion, actualizarSesion, cambiarPantalla, mostrarMensaje } = parametros;

    const [montoOperacion, setMontoOperacion] = useState("");
    const [historialItems, setHistorialItems] = useState<HistorialItemTui[]>([]);
    const [cargandoOperacion, setCargandoOperacion] = useState(false);

    function iniciarDeposito(): void {
        iniciarOperacionMonto("DEPOSITO");
    }

    function iniciarRetiro(): void {
        iniciarOperacionMonto("RETIRO");
    }

    function iniciarOperacionMonto(pantalla: "DEPOSITO" | "RETIRO"): void {
        setMontoOperacion("");
        cambiarPantalla(pantalla);
    }

    async function ejecutarDeposito(): Promise<void> {
        await ejecutarOperacionMonto({
            pantalla: "DEPOSITO",
            tituloExito: "Depósito exitoso",
            tituloError: "Error en depósito",
            mensajeError: "No se pudo procesar el depósito.",
            ejecutar: (cuentaId, monto, correoCliente) => servicios.depositoService.ejecutar({ cuentaId, monto, correoCliente })
        });
    }

    async function ejecutarRetiro(): Promise<void> {
        await ejecutarOperacionMonto({
            pantalla: "RETIRO",
            tituloExito: "Retiro exitoso",
            tituloError: "Error en retiro",
            mensajeError: "Saldo insuficiente o no se pudo procesar el retiro.",
            ejecutar: (cuentaId, monto, correoCliente) =>
                servicios.retiroService.ejecutar({ cuentaId, monto, correoCliente })
        });
    }

    async function ejecutarOperacionMonto(configuracion: ConfiguracionOperacionMonto): Promise<void> {
        if (!sesion) {
            mostrarSesionInvalida();
            return;
        }

        const monto = TuiValidaciones.monto(montoOperacion);

        if (monto === null) {
            mostrarMensaje(
                TuiMensajes.error("Monto inválido", "Ingrese un monto superior a 0."),
                configuracion.pantalla
            );
            return;
        }

        setCargandoOperacion(true);

        try {
            const resultado = await configuracion.ejecutar(sesion.cuentaId, monto, sesion.correoCliente);

            actualizarSesion(sesionActual => ({
                ...sesionActual,
                saldo: resultado.saldoNuevo
            }));

            setMontoOperacion("");

            mostrarMensaje(
                TuiMensajes.exito(configuracion.tituloExito, `Nuevo saldo: $${resultado.saldoNuevo.toFixed(2)}`),
                "MENU_PRINCIPAL"
            );
        } catch (error: unknown) {
            mostrarMensaje(
                TuiMensajes.desdeError(configuracion.tituloError, error, configuracion.mensajeError),
                "MENU_PRINCIPAL"
            );
        } finally {
            setCargandoOperacion(false);
        }
    }

    async function consultarSaldo(): Promise<void> {
        if (!sesion) {
            mostrarSesionInvalida();
            return;
        }

        setCargandoOperacion(true);

        try {
            const cuenta = await servicios.cuentaRepository.buscarPorId(sesion.cuentaId);

            if (cuenta) {
                const saldoActual = cuenta.obtenerSaldo().toNumber();

                actualizarSesion(sesionActual => ({
                    ...sesionActual,
                    saldo: saldoActual
                }));
            }

            cambiarPantalla("SALDO");
        } catch (error: unknown) {
            mostrarMensaje(
                TuiMensajes.desdeError(
                    "Error al consultar saldo",
                    error,
                    "No se pudo consultar el saldo de la cuenta."
                ),
                "MENU_PRINCIPAL"
            );
        } finally {
            setCargandoOperacion(false);
        }
    }

    async function consultarHistorial(): Promise<void> {
        if (!sesion) {
            mostrarSesionInvalida();
            return;
        }

        setCargandoOperacion(true);

        try {
            const resultado = await servicios.historialService.obtenerPorCuenta(sesion.cuentaId);
            setHistorialItems(resultado as HistorialItemTui[]);
            cambiarPantalla("HISTORIAL");
        } catch (error: unknown) {
            setHistorialItems([]);

            mostrarMensaje(
                TuiMensajes.desdeError(
                    "Error al consultar historial",
                    error,
                    "No se pudo consultar el historial de movimientos."
                ),
                "MENU_PRINCIPAL"
            );
        } finally {
            setCargandoOperacion(false);
        }
    }

    function limpiarOperacion(): void {
        setMontoOperacion("");
        setCargandoOperacion(false);
    }

    function mostrarSesionInvalida(): void {
        mostrarMensaje(
            TuiMensajes.error("Sesión inválida", "No existe una sesión activa."),
            "LOGIN_TARJETA"
        );
    }

    return {
        montoOperacion,
        historialItems,
        cargandoOperacion,
        setMontoOperacion,
        iniciarDeposito,
        iniciarRetiro,
        ejecutarDeposito,
        ejecutarRetiro,
        consultarSaldo,
        consultarHistorial,
        limpiarOperacion
    };
}

export type OperacionesController = ReturnType<typeof useOperacionesController>;