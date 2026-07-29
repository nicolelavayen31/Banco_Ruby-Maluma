import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";

interface LoginTarjetaScreenProps {
    numeroTarjeta: string;
    cambiarNumeroTarjeta: (
        valor: string
    ) => void;
    continuar: () => void;
}

export function LoginTarjetaScreen(
    props: LoginTarjetaScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                INGRESO DE TARJETA
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    Número de Tarjeta:{" "}
                </Text>

                <TextInput
                    value={props.numeroTarjeta}
                    onChange={
                        props.cambiarNumeroTarjeta
                    }
                    onSubmit={props.continuar}
                />
            </Box>

            <Box marginTop={1}>
                <Text color="gray">
                    Ingresa 16 dígitos y presiona Enter
                </Text>
            </Box>
        </Box>
    );
}