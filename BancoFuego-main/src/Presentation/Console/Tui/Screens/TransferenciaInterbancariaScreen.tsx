import React from "react";
import {
    Box,
    Text
} from "ink";
import TextInput from "ink-text-input";

import {
    PasoTransferenciaInterbancaria
} from "../TuiTypes";

interface TransferenciaInterbancariaScreenProps {
    paso: PasoTransferenciaInterbancaria;

    codigoBancoDestino: string;
    numeroCuentaDestino: string;
    monto: string;
    concepto: string;

    cargando: boolean;

    cambiarCodigoBancoDestino: (
        valor: string
    ) => void;

    cambiarNumeroCuentaDestino: (
        valor: string
    ) => void;

    cambiarMonto: (
        valor: string
    ) => void;

    cambiarConcepto: (
        valor: string
    ) => void;

    continuar: () => void;
}

export function TransferenciaInterbancariaScreen(
    props: TransferenciaInterbancariaScreenProps
): React.ReactElement {
    const campo =
        obtenerCampo(props);

    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                TRANSFERENCIA INTERBANCARIA
            </Text>

            <Text color="gray">
                Transferencia hacia una cuenta de otra entidad bancaria.
            </Text>

            <Box marginTop={1}>
                <Text bold>
                    {campo.etiqueta}
                </Text>

                <TextInput
                    value={campo.valor}
                    onChange={campo.cambiar}
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
                    Enviando operación a la red bancaria...
                </Text>
            )}
        </Box>
    );
}

interface CampoInterbancario {
    etiqueta: string;
    valor: string;
    cambiar: (
        valor: string
    ) => void;
}

function obtenerCampo(
    props: TransferenciaInterbancariaScreenProps
): CampoInterbancario {
    switch (props.paso) {
        case "BANCO_DESTINO":
            return {
                etiqueta:
                    "Código del banco destino: ",

                valor:
                    props.codigoBancoDestino,

                cambiar:
                    props.cambiarCodigoBancoDestino
            };

        case "CUENTA_DESTINO":
            return {
                etiqueta:
                    "Número de cuenta destino: ",

                valor:
                    props.numeroCuentaDestino,

                cambiar:
                    props.cambiarNumeroCuentaDestino
            };

        case "MONTO":
            return {
                etiqueta:
                    "Monto a transferir: $",

                valor:
                    props.monto,

                cambiar:
                    props.cambiarMonto
            };

        case "CONCEPTO":
            return {
                etiqueta:
                    "Concepto de la transferencia: ",

                valor:
                    props.concepto,

                cambiar:
                    props.cambiarConcepto
            };
    }
}