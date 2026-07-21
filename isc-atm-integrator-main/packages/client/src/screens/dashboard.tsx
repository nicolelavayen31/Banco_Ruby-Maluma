import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { api } from '../services/api.js';

interface TransactionStats {
    data: { total?: number };
    metadata: { pagination?: { totalItems: number } };
}

interface ConciliationSummary {
    data: Array<{ id: string; runAt: string; status: string; summary: { matched: number; discrepancies: number; missing: number } }>;
}

export function DashboardScreen() {
    const [stats, setStats] = useState({ totalTxs: 0, lastConciliation: '', matched: 0, discrepancies: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [txs, concs] = await Promise.all([
                    api<TransactionStats>('transactions?limit=1'),
                    api<ConciliationSummary>('conciliation?limit=1'),
                ]);
                const last = concs.data[0];
                setStats({
                    totalTxs: txs.metadata?.pagination?.totalItems ?? 0,
                    lastConciliation: last?.runAt ? new Date(last.runAt).toLocaleString() : 'N/A',
                    matched: last?.summary?.matched ?? 0,
                    discrepancies: last?.summary?.discrepancies ?? 0,
                });
            } catch {}
            setLoading(false);
        })();
    }, []);

    if (loading) return <Text>Loading dashboard...</Text>;

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Dashboard</Text>
            <Text> </Text>
            <Box borderStyle="round" flexDirection="column" padding={1}>
                <Text>Total Transactions: <Text bold color="green">{stats.totalTxs}</Text></Text>
                <Text>Last Conciliation: {stats.lastConciliation}</Text>
                <Text>  Matched: {stats.matched}  Discrepancies: {stats.discrepancies}</Text>
            </Box>
            <Text dimColor> </Text>
            <Text dimColor>Use Tab/Arrows to navigate screens</Text>
        </Box>
    );
}
