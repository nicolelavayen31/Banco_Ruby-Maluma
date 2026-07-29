import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";
import { MensajeCarga } from "../Components/MensajeCarga";

interface LoginPinScreenProps {
    numeroTarjeta: string;
    pin: string;
    cargando: boolean;
    cambiarPin: (
        valor: string
    ) => void;
    autenticar: () => void;
}

export function LoginPinScreen(
    props: LoginPinScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                AUTENTICACIÓN DE SEGURIDAD
            </Text>

            <Text color="gray">
                Tarjeta: {props.numeroTarjeta}
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    PIN Secreto:{" "}
                </Text>

                <TextInput
                    value={props.pin}
                    onChange={props.cambiarPin}
                    onSubmit={props.autenticar}
                    mask="*"
                />
            </Box>

            <Box marginTop={1}>
                <Text color="magenta">
                    Tras 3 intentos fallidos la tarjeta será bloqueada.
                </Text>
            </Box>

            <MensajeCarga
                activo={props.cargando}
                texto="Conectando..."
            />
        </Box>
    );
}