import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";

import {
    PasoTransferenciaLocal
} from "../TuiTypes";

interface TransferenciaLocalScreenProps {
    paso: PasoTransferenciaLocal;
    numeroCuentaDestino: string;
    monto: string;
    cargando: boolean;

    cambiarNumeroCuentaDestino: (
        valor: string
    ) => void;

    cambiarMonto: (
        valor: string
    ) => void;

    continuar: () => void;
}

export function TransferenciaLocalScreen(
    props: TransferenciaLocalScreenProps
): React.ReactElement {
    const solicitandoCuenta =
        props.paso === "CUENTA_DESTINO";

    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                TRANSFERENCIA LOCAL
            </Text>

            <Text color="gray">
                Transferencia entre cuentas de Banco Fuego.
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    {solicitandoCuenta
                        ? "Número de cuenta destino: "
                        : "Monto a transferir: $"}
                </Text>

                <TextInput
                    value={
                        solicitandoCuenta
                            ? props.numeroCuentaDestino
                            : props.monto
                    }
                    onChange={
                        solicitandoCuenta
                            ? props.cambiarNumeroCuentaDestino
                            : props.cambiarMonto
                    }
                    onSubmit={props.continuar}
                />
            </Box>

            <Box marginTop={1}>
                <Text color="gray">
                    Presiona Enter para continuar
                </Text>
            </Box>

            {props.cargando && (
                <Text color="cyan">
                    Procesando transferencia local...
                </Text>
            )}
        </Box>
    );
}