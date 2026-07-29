import React from "react";
import {
    Box,
    Text
} from "ink";
import SelectInput from "ink-select-input";

import {
    ItemSeleccion
} from "../TuiTypes";

interface ConfirmacionScreenProps {
    titulo: string;
    mensaje: string;
    opciones: ItemSeleccion[];

    seleccionar: (
        item: ItemSeleccion
    ) => void;
}

export function ConfirmacionScreen(
    props: ConfirmacionScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                {props.titulo}
            </Text>

            <Text>
                {props.mensaje}
            </Text>

            <Box marginTop={1}>
                <SelectInput
                    items={props.opciones}
                    onSelect={props.seleccionar}
                />
            </Box>
        </Box>
    );
}