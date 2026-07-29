import React from "react";
import {
    Box,
    Text
} from "ink";
import SelectInput from "ink-select-input";
import {
    opcionesMenuPrincipal
} from "../TuiOptions";
import {
    ItemSeleccion,
    SesionTui
} from "../TuiTypes";

interface MenuPrincipalScreenProps {
    sesion: SesionTui;
    seleccionar: (
        item: ItemSeleccion
    ) => void;
}

export function MenuPrincipalScreen(
    props: MenuPrincipalScreenProps
): React.ReactElement {
    const nombre =
        props.sesion.nombreCliente
            ?.toUpperCase() ?? "";

    return (
        <Box flexDirection="column">
            <Text color="green" bold>
                BIENVENIDO {nombre}
            </Text>

            <Box
                marginTop={1}
                flexDirection="column"
            >
                <Text color="yellow">
                    Selecciona una operación:
                </Text>

                <SelectInput
                    items={opcionesMenuPrincipal}
                    onSelect={props.seleccionar}
                />
            </Box>
        </Box>
    );
}