import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { api } from '../services/api.js';

type Field = 'from_account' | 'to_account' | 'amount' | 'description' | 'source_bank';
const SOURCE_BANKS = ['bank_a', 'bank_b'];

export function TransferScreen() {
    const [fields, setFields] = useState<Record<string, string>>({ from_account: '', to_account: '', amount: '', description: '', source_bank: 'bank_a' });
    const [focused, setFocused] = useState<Field>('from_account');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const fieldOrder: Field[] = ['from_account', 'to_account', 'amount', 'source_bank', 'description'];

    useInput(async (input, key) => {
        if (key.return && !loading) {
            const idx = fieldOrder.indexOf(focused);
            if (idx < fieldOrder.length - 1) {
                setFocused(fieldOrder[idx + 1]);
            } else {
                setLoading(true);
                try {
                    const res = await api<{ data: Array<{ id: string }> }>('transactions/transfer', {
                        method: 'POST',
                        body: {
                            from_account_id: fields.from_account,
                            to_account_id: fields.to_account,
                            amount: parseInt(fields.amount),
                            description: fields.description,
                            source_bank: fields.source_bank,
                        },
                    });
                    setResult(`Transfer created: ${res.data.map((t: { id: string }) => t.id.slice(0, 8)).join(', ')}`);
                } catch (e: unknown) {
                    setResult(`Error: ${(e as Error).message}`);
                }
                setLoading(false);
            }
            return;
        }
        if (key.tab) {
            const idx = fieldOrder.indexOf(focused);
            setFocused(fieldOrder[(idx + 1) % fieldOrder.length]);
            return;
        }
        if (key.backspace || key.delete) {
            setFields(f => ({ ...f, [focused]: f[focused].slice(0, -1) }));
            return;
        }
        if (input && !loading) {
            if (focused === 'source_bank') {
                const idx = SOURCE_BANKS.indexOf(fields.source_bank);
                if (input === 'n') setFields(f => ({ ...f, source_bank: SOURCE_BANKS[(idx + 1) % SOURCE_BANKS.length] }));
                else if (input === 'p') setFields(f => ({ ...f, source_bank: SOURCE_BANKS[(idx - 1 + SOURCE_BANKS.length) % SOURCE_BANKS.length] }));
                return;
            }
            setFields(f => ({ ...f, [focused]: f[focused] + input }));
        }
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Transfer</Text>
            <Text> </Text>
            {fieldOrder.map(field => (
                <Text key={field}>
                    {focused === field ? '> ' : '  '}
                    {field}: <Text color={focused === field ? 'cyan' : undefined}>
                        {field === 'source_bank' ? fields[field] : (fields[field] || <Text dimColor>enter value...</Text>)}
                    </Text>
                    {field === 'source_bank' && focused === field ? <Text dimColor> (n/p to change)</Text> : null}
                </Text>
            ))}
            {result && <Text>{result.startsWith('Error') ? <Text color="red">{result}</Text> : <Text color="green">{result}</Text>}</Text>}
            {loading && <Text dimColor>Processing transfer...</Text>}
            <Text dimColor>Tab to navigate · Enter to submit</Text>
        </Box>
    );
}
