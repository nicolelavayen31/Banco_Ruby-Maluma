import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { LoginScreen } from './screens/login.js';
import { DashboardScreen } from './screens/dashboard.js';
import { TransactionsScreen } from './screens/transactions.js';
import { CreateTransactionScreen } from './screens/create-transaction.js';
import { TransferScreen } from './screens/transfer.js';
import { ConciliationScreen } from './screens/conciliation.js';
import { useAuth } from './hooks/use-auth.js';

type Screen = 'login' | 'dashboard' | 'transactions' | 'create' | 'transfer' | 'conciliation';

export function App() {
    const { isLoggedIn, login, logout } = useAuth();
    const [screen, setScreen] = useState<Screen>(isLoggedIn ? 'dashboard' : 'login');
    const [error, setError] = useState('');

    useInput((input, key) => {
        if (!isLoggedIn) return;

        if (key.escape) {
            setScreen('dashboard');
            return;
        }

        if (key.ctrl && input === 'q') {
            process.exit(0);
        }

        const screenMap: Record<string, Screen> = {
            '1': 'dashboard',
            '2': 'transactions',
            '3': 'create',
            '4': 'transfer',
            '5': 'conciliation',
        };

        if (input in screenMap) {
            setScreen(screenMap[input]);
        }
    });

    const handleLogin = async (email: string, password: string) => {
        try {
            setError('');
            await login(email, password);
            setScreen('dashboard');
        } catch (e: unknown) {
            setError((e as Error).message);
        }
    };

    if (!isLoggedIn) {
        return (
            <Box flexDirection="column" height="100%">
                <LoginScreen onLogin={handleLogin} error={error} />
            </Box>
        );
    }

    return (
        <Box flexDirection="column" height="100%">
            {/* Header */}
            <Box borderStyle="single" paddingX={1}>
                <Text bold>ISC ATM Integrator</Text>
                <Text> </Text>
                <Text>1:Dash 2:Txns 3:New 4:Xfer 5:Concil</Text>
                <Text> </Text>
                <Text dimColor>Esc:Home Ctrl+Q:Quit</Text>
            </Box>

            {/* Content */}
            <Box flexGrow={1} padding={1}>
                {screen === 'dashboard' && <DashboardScreen />}
                {screen === 'transactions' && <TransactionsScreen />}
                {screen === 'create' && <CreateTransactionScreen />}
                {screen === 'transfer' && <TransferScreen />}
                {screen === 'conciliation' && <ConciliationScreen />}
            </Box>
        </Box>
    );
}
