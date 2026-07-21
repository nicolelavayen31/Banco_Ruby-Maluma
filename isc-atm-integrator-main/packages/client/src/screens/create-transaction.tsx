import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { api } from '../services/api.js';

const OPERATIONS = ['withdrawal', 'deposit', 'transfer', 'balance_inquiry', 'pin_change', 'reversal', 'mini_statement'];
const SOURCE_BANKS = ['bank_a', 'bank_b'];

type Field = 'amount' | 'operation' | 'description' | 'type' | 'account_id' | 'source_bank';

export function CreateTransactionScreen() {
    const [fields, setFields] = useState<Record<string, string>>({ amount: '', operation: 'withdrawal', description: '', type: 'debit', account_id: '', source_bank: 'bank_a' });
    const [focused, setFocused] = useState<Field>('account_id');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const fieldOrder: Field[] = ['account_id', 'amount', 'operation', 'type', 'source_bank', 'description'];

    useInput(async (input, key) => {
        if (key.return && !loading) {
            const idx = fieldOrder.indexOf(focused);
            if (idx < fieldOrder.length - 1) {
                setFocused(fieldOrder[idx + 1]);
            } else {
                setLoading(true);
                try {
                    const body = {
                        account_id: fields.account_id,
                        amount: fields.amount ? parseInt(fields.amount) : undefined,
                        operation: fields.operation,
                        type: fields.operation === 'balance_inquiry' || fields.operation === 'pin_change' || fields.operation === 'mini_statement' ? undefined : fields.type,
                        description: fields.description,
                        source_bank: fields.source_bank,
                    };
                    const res = await api<{ data: { id: string } }>('transactions', { method: 'POST', body });
                    setResult(`Created: ${res.data.id}`);
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
            if (focused === 'operation') {
                const idx = OPERATIONS.indexOf(fields.operation);
                if (input === 'n') setFields(f => ({ ...f, operation: OPERATIONS[(idx + 1) % OPERATIONS.length] }));
                else if (input === 'p') setFields(f => ({ ...f, operation: OPERATIONS[(idx - 1 + OPERATIONS.length) % OPERATIONS.length] }));
                return;
            }
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
            <Text bold>Create Transaction</Text>
            <Text> </Text>
            {fieldOrder.map(field => (
                <Text key={field}>
                    {focused === field ? '> ' : '  '}
                    {field}: <Text color={focused === field ? 'cyan' : undefined}>
                        {['operation', 'source_bank'].includes(field) ? fields[field] : (fields[field] || <Text dimColor>enter value...</Text>)}
                    </Text>
                    {field === 'operation' && focused === field ? <Text dimColor> (n/p to change)</Text> : null}
                    {field === 'source_bank' && focused === field ? <Text dimColor> (n/p to change)</Text> : null}
                </Text>
            ))}
            {result && <Text>{result.startsWith('Error') ? <Text color="red">{result}</Text> : <Text color="green">{result}</Text>}</Text>}
            {loading && <Text dimColor>Creating...</Text>}
            <Text dimColor>Tab to navigate · Enter to submit</Text>
        </Box>
    );
}
