import { PantallaTui } from "../TuiTypes";

interface AutenticacionCampos {
    pin: string;
    setPin: (valor: string) => void;
}

interface OperacionesCampos {
    montoOperacion: string;
    setMontoOperacion: (valor: string) => void;
}

interface CambioPinCampos {
    pinActual: string;
    setPinActual: (valor: string) => void;
}

interface TransferenciaLocalCampos {
    numeroCuentaDestino: string;
    montoTransferenciaLocal: string;
    setNumeroCuentaDestino: (valor: string) => void;
    setMontoTransferenciaLocal: (valor: string) => void;
}

interface TransferenciaInterbancariaCampos {
    numeroCuentaDestino: string;
    montoTransferenciaInterbancaria: string;
    setNumeroCuentaDestino: (valor: string) => void;
    setMontoTransferenciaInterbancaria: (valor: string) => void;
}

interface UseCamposTuiControllerProps {
    pantalla: PantallaTui;
    autenticacion: AutenticacionCampos;
    operaciones: OperacionesCampos;
    cambioPin: CambioPinCampos;
    transferenciaLocal: TransferenciaLocalCampos;
    transferenciaInterbancaria: TransferenciaInterbancariaCampos;
}

export function useCamposTuiController({
    pantalla,
    autenticacion,
    operaciones,
    cambioPin,
    transferenciaLocal,
    transferenciaInterbancaria
}: UseCamposTuiControllerProps) {
    const pinMostrado = pantalla === "CAMBIAR_PIN" ? cambioPin.pinActual : autenticacion.pin;

    function setPinMostrado(valor: string): void {
        if (pantalla === "CAMBIAR_PIN") {
            cambioPin.setPinActual(valor);
            return;
        }
        autenticacion.setPin(valor);
    }

    function obtenerMontoMostrado(): string {
        switch (pantalla) {
            case "TRANSFERENCIA_LOCAL":
                return transferenciaLocal.montoTransferenciaLocal;

            case "TRANSFERENCIA_INTERBANCARIA":
                return transferenciaInterbancaria.montoTransferenciaInterbancaria;

            default: return operaciones.montoOperacion;
        }
    }

    function setMontoMostrado(valor: string): void {
        switch (pantalla) {
            case "TRANSFERENCIA_LOCAL":
                transferenciaLocal.setMontoTransferenciaLocal(valor);
                return;

            case "TRANSFERENCIA_INTERBANCARIA":
                transferenciaInterbancaria.setMontoTransferenciaInterbancaria(valor);
                return;

            default:
                operaciones.setMontoOperacion(valor);
        }
    }

    const cuentaDestinoMostrada =
        pantalla === "TRANSFERENCIA_INTERBANCARIA"
            ? transferenciaInterbancaria.numeroCuentaDestino
            : transferenciaLocal.numeroCuentaDestino;

    function setCuentaDestinoMostrada(valor: string): void {
        if (pantalla === "TRANSFERENCIA_INTERBANCARIA") {
            transferenciaInterbancaria.setNumeroCuentaDestino(valor);
            return;
        }

        transferenciaLocal.setNumeroCuentaDestino(valor);
    }

    return {
        pinMostrado,
        setPinMostrado,
        montoMostrado: obtenerMontoMostrado(),
        setMontoMostrado,
        cuentaDestinoMostrada,
        setCuentaDestinoMostrada
    };
}