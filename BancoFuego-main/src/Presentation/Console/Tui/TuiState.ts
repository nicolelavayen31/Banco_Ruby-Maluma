import {
    MensajeTui,
    PantallaTui,
    PasoCambioPin,
    PasoTransferenciaInterbancaria,
    PasoTransferenciaLocal
} from "./TuiTypes";

export const pantallaInicial:
    PantallaTui = "LOGIN_TARJETA";

export const mensajeInicial:
    MensajeTui = {
        titulo: "",
        contenido: ""
    };

export const pasoPinInicial:
    PasoCambioPin = "PIN_ACTUAL";

export const pasoTransferenciaLocalInicial:
    PasoTransferenciaLocal =
        "CUENTA_DESTINO";

export const pasoTransferenciaInterbancariaInicial:
    PasoTransferenciaInterbancaria =
        "BANCO_DESTINO";