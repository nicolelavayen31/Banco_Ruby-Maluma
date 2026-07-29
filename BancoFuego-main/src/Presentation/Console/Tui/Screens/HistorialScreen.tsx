import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { opcionRegresar } from "../TuiOptions";
import { HistorialItemTui } from "../TuiTypes";
import { NaturalezaMovimiento } from "../../../../Domain/Enums/NaturalezaMovimiento";


interface HistorialScreenProps {
    items: HistorialItemTui[];
    regresar: () => void;
}

export function HistorialScreen(
    props: HistorialScreenProps
): React.ReactElement {
    return (
        <Box flexDirection="column">
            <Text color="yellow" bold>
                HISTORIAL DE MOVIMIENTOS
            </Text>

            <Box
                flexDirection="column"
                marginTop={1}
            >
                {props.items.length === 0 ? (
                    <Text color="gray">
                        No se encontraron movimientos para esta cuenta.
                    </Text>
                ) : (
                    props.items.map(
                        (item, indice) => (
                            <Text
                                key={`${item.fecha}-${indice}`}
                                color={
                                    obtenerColorMovimiento(
                                        item.naturaleza
                                    )
                                }
                            >
                                •{" "}
                                {formatearFecha(
                                    item.fecha
                                )}{" "}
                                | {item.tipo}{" "}
                                {item.naturaleza
                                    ? `| [${item.naturaleza}] `
                                    : ""}
                                | $
                                {formatearDinero(
                                    item.monto
                                )}{" "}
                                | Saldo: $
                                {formatearDinero(
                                    item.saldoPosterior
                                )}
                            </Text>
                        )
                    )
                )}
            </Box>

            <Box marginTop={1}>
                <SelectInput
                    items={opcionRegresar}
                    onSelect={props.regresar}
                />
            </Box>
        </Box>
    );
}

function obtenerColorMovimiento(
    naturaleza?: NaturalezaMovimiento
): "green" | "red" | "white" {
    if (naturaleza === "CREDITO") {
        return "green";
    }

    if (naturaleza === "DEBITO") {
        return "red";
    }

    return "white";
}

function formatearFecha(
    fecha: string | Date
): string {
    const fechaNormalizada =
        fecha instanceof Date
            ? fecha
            : new Date(fecha);

    if (
        Number.isNaN(
            fechaNormalizada.getTime()
        )
    ) {
        return String(fecha);
    }

    return fechaNormalizada.toLocaleString(
        "es-EC"
    );
}

function formatearDinero(
    valor: number
): string {
    return Number(valor).toFixed(2);
}