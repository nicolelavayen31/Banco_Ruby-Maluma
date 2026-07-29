import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";

interface OperacionMontoScreenProps {
    titulo: string;
    descripcion: string;
    monto: string;
    cargando: boolean;
    cambiarMonto: (
        valor: string
    ) => void;
    confirmar: () => void;
}

export function OperacionMontoScreen(
    props: OperacionMontoScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                {props.titulo}
            </Text>

            <Text color="gray">
                {props.descripcion}
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    Monto: $
                </Text>

                <TextInput
                    value={props.monto}
                    onChange={props.cambiarMonto}
                    onSubmit={props.confirmar}
                />
            </Box>

            <Box marginTop={1}>
                <Text color="gray">
                    Presiona Enter para confirmar
                </Text>
            </Box>

            {props.cargando && (
                <Box marginTop={1}>
                    <Text color="cyan">
                        Procesando operación...
                    </Text>
                </Box>
            )}
        </Box>
    );
}