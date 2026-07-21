import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface LoginScreenProps {
    onLogin: (email: string, password: string) => Promise<void>;
    error?: string;
}

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [focused, setFocused] = useState<'email' | 'password'>('email');
    const [loading, setLoading] = useState(false);

    useInput(async (input, key) => {
        if (key.return) {
            if (focused === 'email') {
                setFocused('password');
            } else if (email && password) {
                setLoading(true);
                try {
                    await onLogin(email, password);
                } catch {
                    setLoading(false);
                }
            }
            return;
        }
        if (key.tab) {
            setFocused(f => f === 'email' ? 'password' : 'email');
            return;
        }
        if (key.backspace || key.delete) {
            if (focused === 'email') setEmail(e => e.slice(0, -1));
            else setPassword(p => p.slice(0, -1));
            return;
        }
        if (input && !loading) {
            if (focused === 'email') setEmail(e => e + input);
            else setPassword(p => p + input);
        }
    });

    return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" width={60} height={10}>
            <Text bold color="cyan">ISC ATM Integrator</Text>
            <Text> </Text>
            <Box flexDirection="column">
                <Text>{focused === 'email' ? '> ' : '  '}Email: {email || <Text dimColor>type here...</Text>}</Text>
                <Text>{focused === 'password' ? '> ' : '  '}Password: {'•'.repeat(password.length) || <Text dimColor>type here...</Text>}</Text>
            </Box>
            {error && <Text color="red">{error}</Text>}
            {loading && <Text dimColor>Logging in...</Text>}
            <Text dimColor> </Text>
            <Text dimColor>Tab to switch fields · Enter to submit</Text>
        </Box>
    );
}
