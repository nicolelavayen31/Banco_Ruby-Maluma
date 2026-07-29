import "dotenv/config";
import React from 'react';
import { render } from 'ink';
import { App } from './Tui/App';

// Manejar errores de flujo TTY (EPIPE) al redimensionar la consola para evitar cierres abruptos
process.stdout.on('error', (err: any) => {
    if (err?.code === 'EPIPE') return;
});

// Habilitar el buffer de pantalla alternativa (modo pantalla completa)
process.stdout.write('\x1b[?1049h');
process.stdout.write('\x1b[H');

render(<App />);

const cleanup = () => {
    try {
        process.stdout.write('\x1b[?1049l');
    } catch (err) { }
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
});
