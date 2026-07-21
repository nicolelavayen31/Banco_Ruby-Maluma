import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { api } from '../services/api.js';

interface ConciliationRun {
    id: string;
    runAt: string;
    status: string;
    summary: { matched: number; discrepancies: number; missing: number };
}

interface ConciliationReport {
    conciliation: ConciliationRun;
    matches: Array<{ id: string; internalTxId: string; externalTxId?: string; status: string; amountDiff: number; notes?: string }>;
}

interface ConcsResponse {
    data: ConciliationRun[];
}

export function ConciliationScreen() {
    const [concs, setConcs] = useState<ConciliationRun[]>([]);
    const [report, setReport] = useState<ConciliationReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [msg, setMsg] = useState('');

    const load = () => {
        setLoading(true);
        api<ConcsResponse>('conciliation')
            .then(res => setConcs(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    useInput(async (input) => {
        if (input === 'r' && !running) {
            setRunning(true);
            setMsg('Running conciliation...');
            try {
                await api('conciliation/run', { method: 'POST' });
                setMsg('Done!');
                load();
            } catch (e: unknown) {
                setMsg(`Error: ${(e as Error).message}`);
            }
            setRunning(false);
        }
        if (input === 'q') {
            setReport(null);
        }
    });

    const viewReport = async (id: string) => {
        setLoading(true);
        try {
            const res = await api<{ data: ConciliationReport }>(`conciliation/${id}`);
            setReport(res.data);
        } catch (e: unknown) {
            setMsg(`Error: ${(e as Error).message}`);
        }
        setLoading(false);
    };

    if (report) {
        return (
            <Box flexDirection="column" padding={1}>
                <Text bold>Conciliation Report {report.conciliation.id.slice(0, 8)}</Text>
                <Text>Status: {report.conciliation.status}</Text>
                <Text>Matched: {report.conciliation.summary.matched} | Discrepancies: {report.conciliation.summary.discrepancies} | Missing: {report.conciliation.summary.missing}</Text>
                <Text> </Text>
                <Text bold>Matches:</Text>
                {report.matches.map(m => (
                    <Text key={m.id}>
                        {m.status === 'matched' ? <Text color="green">✓</Text> : m.status === 'discrepancy' ? <Text color="yellow">Δ</Text> : <Text color="red">✗</Text>}
                        {' '}{m.internalTxId.slice(0, 8)} - {m.status} {m.amountDiff ? `($${Math.abs(m.amountDiff) / 100})` : ''}
                    </Text>
                ))}
                <Text dimColor>Press q to go back</Text>
            </Box>
        );
    }

    if (loading) return <Text>Loading...</Text>;

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Conciliations</Text>
            <Text> </Text>
            {concs.length === 0 ? (
                <Text dimColor>No conciliations yet. Press r to run one.</Text>
            ) : (
                <Box flexDirection="column">
                    <Box>
                        <Box width={5}><Text bold>#</Text></Box>
                        <Box width={12}><Text bold>Date</Text></Box>
                        <Box width={10}><Text bold>Status</Text></Box>
                        <Box width={10}><Text bold>Match</Text></Box>
                        <Box width={10}><Text bold>Diff</Text></Box>
                        <Box width={10}><Text bold>Miss</Text></Box>
                    </Box>
                    {concs.map((c, i) => (
                        <Box key={c.id}>
                            <Box width={5}><Text>{i + 1}</Text></Box>
                            <Box width={12}><Text>{new Date(c.runAt).toLocaleDateString()}</Text></Box>
                            <Box width={10}><Text color={c.status === 'completed' ? 'green' : 'yellow'}>{c.status}</Text></Box>
                            <Box width={10}><Text>{c.summary.matched}</Text></Box>
                            <Box width={10}><Text color="yellow">{c.summary.discrepancies}</Text></Box>
                            <Box width={10}><Text color="red">{c.summary.missing}</Text></Box>
                        </Box>
                    ))}
                </Box>
            )}
            {msg && <Text>{msg.startsWith('Error') ? <Text color="red">{msg}</Text> : <Text color="green">{msg}</Text>}</Text>}
            {running && <Text dimColor>Running...</Text>}
            <Text dimColor>r: run conciliation · Enter on # to view report</Text>
        </Box>
    );
}
