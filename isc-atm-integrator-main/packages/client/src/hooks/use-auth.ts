import { useState, useCallback, useEffect } from 'react';
import { api, clearToken } from '../services/api.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.token');

function readToken(): string | null {
    try {
        if (existsSync(TOKEN_PATH)) {
            return readFileSync(TOKEN_PATH, 'utf-8').trim();
        }
    } catch {}
    return null;
}

interface LoginResponse {
    data: { accessToken: string };
}

export function useAuth() {
    const [token, setToken] = useState<string | null>(readToken);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api<LoginResponse>('auth/login', {
            method: 'POST',
            body: { email, password },
        });
        const { saveToken } = await import('../services/api.js');
        saveToken(res.data.accessToken);
        setToken(res.data.accessToken);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
    }, []);

    return { token, isLoggedIn: !!token, login, logout };
}
