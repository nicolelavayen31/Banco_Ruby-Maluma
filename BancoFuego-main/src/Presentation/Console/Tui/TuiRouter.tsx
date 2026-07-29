import React from "react";
import { opcionesConfirmarCancelacion, opcionesConfirmarSalida } from "./TuiOptions";
import { TuiController } from "./Controllers/useTuiController";
import { LoginTarjetaScreen } from "./Screens/LoginTarjetaScreen";
import { LoginPinScreen } from "./Screens/LoginPinScreen";
import { MenuPrincipalScreen } from "./Screens/MenuPrincipalScreen";
import { OperacionMontoScreen } from "./Screens/OperacionMontoScreen";
import { TipoTransferenciaScreen } from "./Screens/TipoTransferenciaScreen";
import { TransferenciaLocalScreen } from "./Screens/TransferenciaLocalScreen";
import { TransferenciaInterbancariaScreen } from "./Screens/TransferenciaInterbancariaScreen";
import { SaldoScreen } from "./Screens/SaldoScreen";
import { HistorialScreen } from "./Screens/HistorialScreen";
import { CambiarPinScreen } from "./Screens/CambiarPinScreen";
import { MensajeScreen } from "./Screens/MensajeScreen";
import { ConfirmacionScreen } from "./Screens/ConfirmacionScreen";
import { DespedidaScreen } from "./Screens/DespedidaScreen";

interface TuiRouterProps {
    tui: TuiController;
}

export function TuiRouter( props: TuiRouterProps ): React.ReactElement | null {
    
    const { tui } = props;

    switch (tui.pantalla) {
        case "LOGIN_TARJETA": return (
            <LoginTarjetaScreen 
                numeroTarjeta={  tui.numeroTarjeta }
                cambiarNumeroTarjeta={ tui.setNumeroTarjeta }
                continuar={ tui.handleTarjetaSubmit }
            />
        );

        case "LOGIN_PIN": return (
            <LoginPinScreen 
                numeroTarjeta={ tui.numeroTarjeta }
                pin={tui.pin}
                cargando={ tui.cargando }
                cambiarPin={ tui.setPin }
                autenticar={ tui.handlePinSubmit }
            />
        );

        case "MENU_PRINCIPAL":
            if (!tui.sesion) {
                return null;
            }

            return (
                <MenuPrincipalScreen
                    sesion={tui.sesion}
                    seleccionar={
                        tui.handleMenuSelect
                    }
                />
            );

        case "DEPOSITO":
            return (
                <OperacionMontoScreen
                    titulo="DEPOSITAR DINERO"
                    descripcion="Ingresa el monto que deseas depositar. Presiona ESC para cancelar."
                    monto={tui.montoInput}
                    cargando={tui.cargando}
                    cambiarMonto={
                        tui.setMontoInput
                    }
                    confirmar={
                        tui.handleDepositoSubmit
                    }
                />
            );

        case "RETIRO":
            return (
                <OperacionMontoScreen
                    titulo="RETIRAR EFECTIVO"
                    descripcion="Ingresa el monto que deseas retirar. Presiona ESC para cancelar."
                    monto={tui.montoInput}
                    cargando={tui.cargando}
                    cambiarMonto={
                        tui.setMontoInput
                    }
                    confirmar={
                        tui.handleRetiroSubmit
                    }
                />
            );

        case "TIPO_TRANSFERENCIA":
            return (
                <TipoTransferenciaScreen
                    seleccionar={
                        tui.handleTipoTransferenciaSelect
                    }
                />
            );

        case "TRANSFERENCIA_LOCAL":
            return (
                <TransferenciaLocalScreen
                    paso={
                        tui.pasoTransferenciaLocal
                    }
                    numeroCuentaDestino={
                        tui.cuentaDestinoInput
                    }
                    monto={tui.montoInput}
                    cargando={tui.cargando}
                    cambiarNumeroCuentaDestino={
                        tui.setCuentaDestinoInput
                    }
                    cambiarMonto={
                        tui.setMontoInput
                    }
                    continuar={
                        tui.handleTransferenciaLocalContinuar
                    }
                />
            );

        case "TRANSFERENCIA_INTERBANCARIA":
            return (
                <TransferenciaInterbancariaScreen
                    paso={
                        tui.pasoTransferenciaInterbancaria
                    }
                    codigoBancoDestino={
                        tui.codigoBancoDestino
                    }
                    numeroCuentaDestino={
                        tui.cuentaDestinoInput
                    }
                    monto={tui.montoInput}
                    concepto={
                        tui.conceptoTransferencia
                    }
                    cargando={tui.cargando}
                    cambiarCodigoBancoDestino={
                        tui.setCodigoBancoDestino
                    }
                    cambiarNumeroCuentaDestino={
                        tui.setCuentaDestinoInput
                    }
                    cambiarMonto={
                        tui.setMontoInput
                    }
                    cambiarConcepto={
                        tui.setConceptoTransferencia
                    }
                    continuar={
                        tui.handleTransferenciaInterbancariaContinuar
                    }
                />
            );

        case "SALDO":
            if (!tui.sesion) {
                return null;
            }

            return (
                <SaldoScreen
                    sesion={tui.sesion}
                    regresar={
                        tui.regresarAlMenu
                    }
                />
            );

        case "HISTORIAL":
            return (
                <HistorialScreen
                    items={
                        tui.historialItems
                    }
                    regresar={
                        tui.regresarAlMenu
                    }
                />
            );

        case "CAMBIAR_PIN":
            return (
                <CambiarPinScreen
                    paso={tui.pasoPin}
                    pinActual={tui.pin}
                    pinNuevo={
                        tui.pinNuevoInput
                    }
                    cargando={tui.cargando}
                    cambiarPinActual={
                        tui.setPin
                    }
                    cambiarPinNuevo={
                        tui.setPinNuevoInput
                    }
                    continuar={
                        tui.handleCambiarPinContinuar
                    }
                />
            );

        case "MENSAJE":
            return (
                <MensajeScreen
                    mensaje={tui.mensaje}
                    continuar={
                        tui.handleMensajeContinuar
                    }
                />
            );

        case "CONFIRMAR_SALIDA":
            return (
                <ConfirmacionScreen
                    titulo="CERRAR SESIÓN"
                    mensaje="¿Deseas cerrar la sesión actual?"
                    opciones={
                        opcionesConfirmarSalida
                    }
                    seleccionar={
                        tui.handleConfirmarSalidaSelect
                    }
                />
            );

        case "CONFIRMAR_CANCELACION":
            return (
                <ConfirmacionScreen
                    titulo="CANCELAR OPERACIÓN"
                    mensaje="¿Deseas cancelar la operación actual?"
                    opciones={
                        opcionesConfirmarCancelacion
                    }
                    seleccionar={
                        tui.handleConfirmarCancelacionSelect
                    }
                />
            );

        case "DESPEDIDA":
            return (
                <DespedidaScreen
                    nombreCliente={
                        tui.sesion
                            ?.nombreCliente
                    }
                    continuar={
                        tui.handleDespedidaContinuar
                    }
                />
            );

        default:
            return null;
    }
}