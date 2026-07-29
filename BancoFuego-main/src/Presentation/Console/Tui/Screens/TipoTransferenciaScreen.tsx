import React from "react";
import {
    Box,
    Text
} from "ink";
import SelectInput from "ink-select-input";
import {
    opcionesTipoTransferencia
} from "../TuiOptions";
import {
    ItemSeleccion
} from "../TuiTypes";

interface TipoTransferenciaScreenProps {
    seleccionar: (
        item: ItemSeleccion
    ) => void;
}

export function TipoTransferenciaScreen(
    props: TipoTransferenciaScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                TIPO DE TRANSFERENCIA
            </Text>

            <Text color="gray">
                Selecciona la operación que deseas realizar.
            </Text>

            <Box marginTop={1}>
                <SelectInput
                    items={
                        opcionesTipoTransferencia
                    }
                    onSelect={
                        props.seleccionar
                    }
                />
            </Box>
        </Box>
    );
}