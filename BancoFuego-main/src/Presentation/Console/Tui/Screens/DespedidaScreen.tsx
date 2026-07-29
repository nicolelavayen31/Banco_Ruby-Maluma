import React from "react";

import {
    Box,
    Text
} from "ink";

import SelectInput from "ink-select-input";

interface DespedidaScreenProps {
    nombreCliente?: string;
    continuar: () => void;
}

const opcionesDespedida = [
    {
        label: "↩ Volver al inicio",
        value: "inicio"
    }
];

export function DespedidaScreen(
    props: DespedidaScreenProps
): React.ReactElement {
    return (
        <Box
            flexDirection="column"
            alignItems="center"
        >
            <Text color="green" bold>
                SESIÓN FINALIZADA
            </Text>

            <Box marginTop={1}>
                <Text>
                    Gracias por utilizar Banco Fuego
                    {props.nombreCliente
                        ? `, ${props.nombreCliente}`
                        : ""}
                    .
                </Text>
            </Box>

            <Text color="gray">
                Retira tu tarjeta y verifica tus pertenencias.
            </Text>

            <Box marginTop={1}>
                <SelectInput
                    items={opcionesDespedida}
                    onSelect={props.continuar}
                />
            </Box>
        </Box>
    );
}