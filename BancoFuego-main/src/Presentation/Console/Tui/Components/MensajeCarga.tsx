import React from "react";
import { Text } from "ink";

interface MensajeCargaProps {
    activo: boolean;
    texto: string;
}

export function MensajeCarga(
    props: MensajeCargaProps
): React.ReactElement | null {
    if (!props.activo) {
        return null;
    }

    return (
        <Text color="cyan">
            {props.texto}
        </Text>
    );
}