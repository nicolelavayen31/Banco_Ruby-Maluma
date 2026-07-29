import React from "react";
import { Box, Text } from "ink";

interface TuiLayoutProps {
    children: React.ReactNode;
}

export function TuiLayout(
    props: TuiLayoutProps
): React.ReactElement {
    return (
        <Box
            flexDirection="column"
            padding={1}
            borderStyle="single"
            borderColor="red"
            minHeight={15}
        >
            <Box
                flexDirection="column"
                marginBottom={1}
                alignItems="center"
            >
                <Text color="red" bold>
                    🔥 BANCO FUEGO - CAJERO AUTOMÁTICO 🔥
                </Text>

                <Text color="gray">
                    ===================================================
                </Text>
            </Box>

            {props.children}
        </Box>
    );
}