import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";
import {
    PasoCambioPin
} from "../TuiTypes";

interface CambiarPinScreenProps {
    paso: PasoCambioPin;
    pinActual: string;
    pinNuevo: string;
    cargando: boolean;
    cambiarPinActual: (
        valor: string
    ) => void;
    cambiarPinNuevo: (
        valor: string
    ) => void;
    continuar: () => void;
}

export function CambiarPinScreen(
    props: CambiarPinScreenProps
): React.ReactElement {
    const solicitandoPinActual =
        props.paso === "PIN_ACTUAL";

    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                CAMBIAR PIN
            </Text>

            <Text color="gray">
                {solicitandoPinActual
                    ? "Ingresa tu PIN actual."
                    : "Ingresa el nuevo PIN."}
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    {solicitandoPinActual
                        ? "PIN actual: "
                        : "PIN nuevo: "}
                </Text>

                <TextInput
                    value={
                        solicitandoPinActual
                            ? props.pinActual
                            : props.pinNuevo
                    }
                    onChange={
                        solicitandoPinActual
                            ? props.cambiarPinActual
                            : props.cambiarPinNuevo
                    }
                    onSubmit={props.continuar}
                    mask="*"
                />
            </Box>

            <Box marginTop={1}>
                <Text color="gray">
                    Presiona Enter para continuar
                </Text>
            </Box>

            {props.cargando && (
                <Text color="cyan">
                    Actualizando PIN...
                </Text>
            )}
        </Box>
    );
}