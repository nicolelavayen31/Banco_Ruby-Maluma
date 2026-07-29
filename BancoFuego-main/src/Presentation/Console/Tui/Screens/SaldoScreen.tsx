import React from "react";
import {
    Box,
    Text
} from "ink";
import SelectInput from "ink-select-input";
import {
    opcionRegresar
} from "../TuiOptions";
import {
    SesionTui
} from "../TuiTypes";

interface SaldoScreenProps {
    sesion: SesionTui;
    regresar: () => void;
}

export function SaldoScreen(
    props: SaldoScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                CONSULTA DE SALDO
            </Text>

            <Text>
                Número de Cuenta:{" "}
                {props.sesion.numeroCuenta}
            </Text>

            <Text color="green" bold>
                Saldo Disponible: $
                {props.sesion.saldo.toFixed(2)}
            </Text>

            <Box marginTop={1}>
                <SelectInput
                    items={opcionRegresar}
                    onSelect={props.regresar}
                />
            </Box>
        </Box>
    );
}