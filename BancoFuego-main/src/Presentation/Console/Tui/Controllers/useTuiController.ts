import { useMemo } from "react";
import { crearServiciosTui } from "../TuiServices";
import { ItemSeleccion } from "../TuiTypes";
import { useNavegacionController } from "./useNavegacionController";
import { useAutenticacionController } from "./useAutenticacionController";
import { useOperacionesController } from "./useOperacionesController";
import { useCambioPinController } from "./useCambioPinController";
import { useCamposTuiController } from "./useCamposTuiController";
import { useTransferenciaLocalController } from "./Transferencias/useTransferenciaLocalController";
import { useTransferenciaInterbancariaController } from "./Transferencias/useTransferenciaInterbancariaController";
import { useTransferenciasController } from "./Transferencias/useTransferenciasController";

export function useTuiController() {
    const servicios = useMemo(() => crearServiciosTui(), []);
    const navegacion = useNavegacionController();

    const autenticacion = useAutenticacionController({
        servicios,
        cambiarPantalla: navegacion.cambiarPantalla,
        mostrarMensaje: navegacion.mostrarMensaje
    });

    const operaciones = useOperacionesController({
        servicios,
        sesion: autenticacion.sesion,
        actualizarSesion: autenticacion.actualizarSesion,
        cambiarPantalla: navegacion.cambiarPantalla,
        mostrarMensaje: navegacion.mostrarMensaje
    });

    const cambioPin = useCambioPinController({
        servicios,
        numeroTarjeta: autenticacion.numeroTarjeta,
        cambiarPantalla: navegacion.cambiarPantalla,
        mostrarMensaje: navegacion.mostrarMensaje
    });

    const transferenciaLocal = useTransferenciaLocalController({
        servicios,
        sesion: autenticacion.sesion,
        actualizarSesion: autenticacion.actualizarSesion,
        mostrarMensaje: navegacion.mostrarMensaje
    });

    const transferenciaInterbancaria = useTransferenciaInterbancariaController({
        servicios,
        sesion: autenticacion.sesion,
        actualizarSesion: autenticacion.actualizarSesion,
        mostrarMensaje: navegacion.mostrarMensaje
    });

    const transferencias = useTransferenciasController({
        cambiarPantalla: navegacion.cambiarPantalla,
        limpiarTransferenciaLocal: transferenciaLocal.limpiar,
        limpiarTransferenciaInterbancaria: transferenciaInterbancaria.limpiar
    });

    const campos = useCamposTuiController({
        pantalla: navegacion.pantalla,
        autenticacion: {
            pin: autenticacion.pin,
            setPin: autenticacion.setPin
        },
        operaciones: {
            montoOperacion: operaciones.montoOperacion,
            setMontoOperacion: operaciones.setMontoOperacion
        },
        cambioPin: {
            pinActual: cambioPin.pinActual,
            setPinActual: cambioPin.setPinActual
        },
        transferenciaLocal: {
            numeroCuentaDestino: transferenciaLocal.numeroCuentaDestino,
            montoTransferenciaLocal: transferenciaLocal.montoTransferenciaLocal,
            setNumeroCuentaDestino: transferenciaLocal.setNumeroCuentaDestino,
            setMontoTransferenciaLocal: transferenciaLocal.setMontoTransferenciaLocal
        },
        transferenciaInterbancaria: {
            numeroCuentaDestino: transferenciaInterbancaria.numeroCuentaDestino,
            montoTransferenciaInterbancaria: transferenciaInterbancaria.montoTransferenciaInterbancaria,
            setNumeroCuentaDestino: transferenciaInterbancaria.setNumeroCuentaDestino,
            setMontoTransferenciaInterbancaria: transferenciaInterbancaria.setMontoTransferenciaInterbancaria
        }
    });

    async function handleMenuSelect(item: ItemSeleccion): Promise<void> {
        switch (item.value) {
            case "depositar":
                operaciones.iniciarDeposito();
                return;

            case "retirar":
                operaciones.iniciarRetiro();
                return;

            case "transferir":
                transferencias.iniciar();
                return;

            case "saldo":
                await operaciones.consultarSaldo();
                return;

            case "historial":
                await operaciones.consultarHistorial();
                return;

            case "cambiar_pin":
                cambioPin.iniciarCambioPin();
                return;

            case "salir":
                navegacion.abrirConfirmacionSalida();
                return;
        }
    }

    function handleConfirmarSalidaSelect(item: ItemSeleccion): void {
        if (item.value === "si") {
            navegacion.abrirDespedida();
            return;
        }

        navegacion.regresarAlMenu();
    }

    function handleConfirmarCancelacionSelect(item: ItemSeleccion): void {
        if (item.value === "no") {
            navegacion.rechazarCancelacion();
            return;
        }

        navegacion.confirmarCancelacion(obtenerLimpiadorOperacionActual());
    }

    function obtenerLimpiadorOperacionActual(): () => void {
        switch (navegacion.pantallaPreviaCancelacion) {
            case "DEPOSITO":
            case "RETIRO":
                return operaciones.limpiarOperacion;

            case "CAMBIAR_PIN":
                return cambioPin.limpiar;

            case "TRANSFERENCIA_LOCAL":
                return transferenciaLocal.limpiar;

            case "TRANSFERENCIA_INTERBANCARIA":
                return transferenciaInterbancaria.limpiar;

            default:
                return () => undefined;
        }
    }

    function handleDespedidaContinuar(): void {
        autenticacion.cerrarSesion();
        navegacion.regresarAlInicio();
    }

    const cargando =
        autenticacion.cargandoAutenticacion ||
        operaciones.cargandoOperacion ||
        cambioPin.cargandoCambioPin ||
        transferenciaLocal.cargandoTransferenciaLocal ||
        transferenciaInterbancaria.cargandoTransferenciaInterbancaria;

    return {
        pantalla: navegacion.pantalla,
        mensaje: navegacion.mensaje,

        numeroTarjeta: autenticacion.numeroTarjeta,
        pin: campos.pinMostrado,
        sesion: autenticacion.sesion,

        montoInput: campos.montoMostrado,
        cargando,
        historialItems: operaciones.historialItems,

        pinNuevoInput: cambioPin.pinNuevo,
        pasoPin: cambioPin.pasoCambioPin,

        cuentaDestinoInput: campos.cuentaDestinoMostrada,
        pasoTransferenciaLocal: transferenciaLocal.pasoTransferenciaLocal,
        pasoTransferenciaInterbancaria: transferenciaInterbancaria.pasoTransferenciaInterbancaria,

        codigoBancoDestino: transferenciaInterbancaria.codigoBancoDestino,
        conceptoTransferencia: transferenciaInterbancaria.conceptoTransferencia,

        setNumeroTarjeta: autenticacion.setNumeroTarjeta,
        setPin: campos.setPinMostrado,
        setMontoInput: campos.setMontoMostrado,
        setPinNuevoInput: cambioPin.setPinNuevo,
        setCuentaDestinoInput: campos.setCuentaDestinoMostrada,
        setCodigoBancoDestino: transferenciaInterbancaria.setCodigoBancoDestino,
        setConceptoTransferencia: transferenciaInterbancaria.setConceptoTransferencia,

        handleTarjetaSubmit: autenticacion.continuarTarjeta,
        handlePinSubmit: autenticacion.autenticar,
        handleMenuSelect,

        handleTipoTransferenciaSelect: transferencias.seleccionarTipo,
        handleTransferenciaLocalContinuar: transferenciaLocal.continuar,
        handleTransferenciaInterbancariaContinuar: transferenciaInterbancaria.continuar,

        handleDepositoSubmit: operaciones.ejecutarDeposito,
        handleRetiroSubmit: operaciones.ejecutarRetiro,
        handleCambiarPinContinuar: cambioPin.continuar,

        handleConfirmarSalidaSelect,
        handleConfirmarCancelacionSelect,
        handleMensajeContinuar: navegacion.continuarMensaje,
        handleDespedidaContinuar,

        regresarAlMenu: navegacion.regresarAlMenu
    };
}

export type TuiController = ReturnType<typeof useTuiController>;