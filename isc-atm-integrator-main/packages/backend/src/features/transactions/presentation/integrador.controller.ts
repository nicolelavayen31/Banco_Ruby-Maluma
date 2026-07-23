import { Controller, Post, Body, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
    path: 'integrador',
    version: VERSION_NEUTRAL,
})
export class IntegradorController {
    @Post('interbank-transfer')
    public async processInterbankTransfer(
        @Body() body: any,
    ) {
        console.log('Interbank Transfer received at Integrador:', body);
        
        const { cuentaDestino, bancoDestino, monto } = body;
        
        // Determinar el puerto y URL de destino
        let targetUrl = '';
        const destination = String(bancoDestino).toLowerCase();
        
        if (destination.includes('ruby')) {
            targetUrl = `http://localhost:5000/api/cuentas/${cuentaDestino}/depositar`;
        } else if (destination.includes('maluma')) {
            targetUrl = `http://localhost:5002/api/cuentas/${cuentaDestino}/depositar`;
        }
        
        if (targetUrl) {
            try {
                console.log(`Forwarding deposit to: ${targetUrl} with amount: ${monto}`);
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monto }),
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error forwarding transfer:', errorText);
                    return {
                        status: 'ERROR',
                        message: `El banco de destino rechazó la acreditación: ${errorText}`,
                    };
                }
                
                console.log('Transfer forwarded and credited successfully!');
            } catch (err: any) {
                console.error('Failed to connect to destination bank:', err.message);
                return {
                    status: 'ERROR',
                    message: `No se pudo conectar con el banco de destino para acreditar: ${err.message}`,
                };
            }
        } else {
            console.warn('Unknown destination bank:', bancoDestino);
        }
        
        return {
            status: 'SUCCESS',
            message: 'Transferencia interbancaria procesada con éxito en el Integrador ATM.',
        };
    }
}
