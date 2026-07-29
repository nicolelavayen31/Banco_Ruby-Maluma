import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import {
    opcionContinuar
} from "../TuiOptions";
import {
    MensajeTui
} from "../TuiTypes";

interface MensajeScreenProps {
    mensaje: MensajeTui;
    continuar: () => void;
}

export function MensajeScreen(
    props: MensajeScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text
                color={
                    props.mensaje.error
                        ? "red"
                        : "green"
                }
                bold
            >
                {props.mensaje.titulo}
            </Text>

            <Text>
                {props.mensaje.contenido}
            </Text>

            <Box marginTop={1}>
                <SelectInput
                    items={opcionContinuar}
                    onSelect={props.continuar}
                />
            </Box>
        </Box>
    );
}