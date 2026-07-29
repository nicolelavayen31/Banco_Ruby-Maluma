import { ItemSeleccion, PantallaTui } from "../../TuiTypes";

interface UseTransferenciasControllerParametros {
    cambiarPantalla: (pantalla: PantallaTui) => void;
    limpiarTransferenciaLocal: () => void;
    limpiarTransferenciaInterbancaria: () => void;
}

export function useTransferenciasController(parametros: UseTransferenciasControllerParametros) {
    const {
        cambiarPantalla,
        limpiarTransferenciaLocal,
        limpiarTransferenciaInterbancaria
    } = parametros;

    function iniciar(): void {
        limpiarTodas();
        cambiarPantalla("TIPO_TRANSFERENCIA");
    }

    function seleccionarTipo(item: ItemSeleccion): void {
        const acciones: Record<string, () => void> = {
            local: () => abrirTransferencia("TRANSFERENCIA_LOCAL", limpiarTransferenciaLocal),
            interbancaria: () => abrirTransferencia(
                "TRANSFERENCIA_INTERBANCARIA",
                limpiarTransferenciaInterbancaria
            ),
            regresar: () => cambiarPantalla("MENU_PRINCIPAL")
        };
        const accion = acciones[item.value] ?? acciones.regresar;
        accion();
    }

    function abrirTransferencia(pantalla: PantallaTui, limpiar: () => void): void {
        limpiar();
        cambiarPantalla(pantalla);
    }

    function limpiarTodas(): void {
        limpiarTransferenciaLocal();
        limpiarTransferenciaInterbancaria();
    }

    return {
        iniciar,
        seleccionarTipo,
        limpiarTodas
    };
}
export type TransferenciasController = ReturnType<typeof useTransferenciasController>;