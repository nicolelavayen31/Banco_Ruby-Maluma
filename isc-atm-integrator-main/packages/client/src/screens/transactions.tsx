import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { api } from '../services/api.js';

interface Transaction {
    id: string;
    amount?: number;
    operation: string;
    type?: string;
    state: string;
    description: string;
    bankAccountId: string;
    correlationId?: string;
    sourceBank: string;
    createdAt: string;
}

interface TxResponse {
    data: Transaction[];
    metadata: { pagination?: { page: number; limit: number; totalItems: number } };
}

export function TransactionsScreen() {
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params: Record<string, string | number | undefined> = { page, limit: 10 };
        if (filter) params.sourceBank = filter;

        api<TxResponse>('transactions', { params })
            .then(res => {
                setTxs(res.data);
                setTotal(res.metadata?.pagination?.totalItems ?? 0);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page, filter]);

    if (loading) return <Text>Loading transactions...</Text>;

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Transactions</Text>
            <Text dimColor>Filter: {['', 'bank_a', 'bank_b'].map(f => (
                filter === f ? <Text key={f} bold> [{f || 'all'}] </Text> : <Text key={f}> {f || 'all'} </Text>
            ))}</Text>
            <Text> </Text>
            {txs.length === 0 ? (
                <Text dimColor>No transactions found</Text>
            ) : (
                <Box flexDirection="column">
                    {/* Header */}
                    <Box>
                        <Box width={5}><Text bold>#</Text></Box>
                        <Box width={12}><Text bold>ID</Text></Box>
                        <Box width={10}><Text bold>Op</Text></Box>
                        <Box width={10}><Text bold>Amount</Text></Box>
                        <Box width={10}><Text bold>State</Text></Box>
                        <Box width={10}><Text bold>Bank</Text></Box>
                    </Box>
                    {txs.map((tx, i) => (
                        <Box key={tx.id}>
                            <Box width={5}><Text>{(page - 1) * 10 + i + 1}</Text></Box>
                            <Box width={12}><Text>{tx.id.slice(0, 8)}..</Text></Box>
                            <Box width={10}><Text>{tx.operation}</Text></Box>
                            <Box width={10}><Text>{tx.amount != null ? `$${(tx.amount / 100).toFixed(2)}` : '-'}</Text></Box>
                            <Box width={10}><Text color={tx.state === 'success' ? 'green' : tx.state === 'pending' ? 'yellow' : 'red'}>{tx.state}</Text></Box>
                            <Box width={10}><Text>{tx.sourceBank}</Text></Box>
                        </Box>
                    ))}
                </Box>
            )}
            <Text dimColor>Page {page} of {Math.ceil(total / 10)} · Prev (p) · Next (n)</Text>
        </Box>
    );
}
