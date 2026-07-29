import { Evento } from "../../../Shared/Events/Evento";
import { IEventSubscriber } from "../../../Shared/Events/IEventSubscriber";
import logger from "../../../Shared/Logging/Logger";
import { NodemailerEmailService } from "../../../Infrastructure/Email/NodemailerEmailService";
import { CuentaRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres";
import { ClienteRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/ClienteRepositoryPostgres";

interface DatosCorreoEvento {
    correoCliente?: string;
    email?: string;
    cuentaId?: number;
    monto?: number;
    saldoNuevo?: number;
    saldoNuevoOrigen?: number;
    numeroCuentaDestino?: string;
    cuentaDestinoId?: number;
    tipo?: string;
    naturaleza?: "DEBITO" | "CREDITO";
    origen?: {
        cuentaId?: number;
        saldoNuevo?: number;
    };

    destino?: {
        cuentaId?: number;
    };
}

export class CorreoSubscriber implements IEventSubscriber {

    private readonly emailService = new NodemailerEmailService();
    private readonly cuentaRepo =  new CuentaRepositoryPostgres();
    private readonly clienteRepo =  new ClienteRepositoryPostgres();

    public async manejar(
        evento: Evento
    ): Promise<void> {
        logger.info( `[CORREO] Procesando evento: ${evento.nombre}` );

        const datos = (evento.datos ?? {}) as DatosCorreoEvento;
        let destinatario =
            datos.correoCliente ??
            datos.email;
        const cuentaIdBusqueda =
            datos.cuentaId ??
            datos.origen?.cuentaId;

        if (
            !destinatario &&
            cuentaIdBusqueda !== undefined
        ) {
            try {
                const cuenta = await this.cuentaRepo.buscarPorId( cuentaIdBusqueda);
                const clienteId = cuenta?.obtenerIdCliente();
                if (clienteId !== undefined) {
                    const cliente = await this.clienteRepo.buscarPorId(clienteId );
                    destinatario = cliente?.obtenerCorreo();
                }
            } catch (error: unknown) {
                const mensaje =
                    error instanceof Error
                        ? error.message
                        : String(error);

                logger.error( `[CORREO] Error al buscar correo del cliente para la cuenta ${cuentaIdBusqueda}: ${mensaje}`);
            }
        }

        if (!destinatario) {
            logger.info(`[CORREO] No se especificó correo para el evento ${evento.nombre}. Se omite envío SMTP.`);
            return;
        }

        let asunto = `Banco Fuego - Notificación de ${evento.nombre}`;
        let htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ff4500; border-radius: 8px;">
                <h2 style="color: #ff4500;">🔥 Banco Fuego</h2>
                <p>Estimado cliente,</p>
                <p>Le notificamos que se ha registrado una actividad en su cuenta:</p>
                <ul>
                    <li><strong>Evento:</strong> ${evento.nombre}</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p style="color: #666; font-size: 12px;">
                    Si usted no reconoce esta operación, por favor contacte de inmediato con nuestra agencia bancaria.
                </p>
            </div>
        `;

        if (evento.nombre === "DEPOSITO_REALIZADO") {
            asunto = "🔥 Banco Fuego - Notificación de Depósito Exitoso";
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #28a745; border-radius: 8px;">
                    <h2 style="color: #28a745;">🔥 Banco Fuego - Depósito Confirmado</h2>
                    <p>Se ha abonado exitosamente a su cuenta.</p>
                    <p><strong>Monto Depositado:</strong> $${datos.monto ?? "0.00"}</p>
        
                    <p style="color: #666; font-size: 12px;">
                        Gracias por confiar en Banco Fuego.
                    </p>
                </div>
            `;
        } else if ( evento.nombre === "RETIRO_REALIZADO"){
            asunto = "🔥 Banco Fuego - Alerta de Retiro de Efectivo";
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #dc3545; border-radius: 8px;">
                    <h2 style="color: #dc3545;">🔥 Banco Fuego - Retiro de Efectivo</h2>
                    <p>Se ha realizado un retiro de dinero en su cuenta.</p>
                    <p><strong>Monto Retirado:</strong> $${datos.monto ?? "0.00"}</p>
                    
                    <p style="color: #666; font-size: 12px;">
                        Si no realizó esta transacción, bloquee su tarjeta o comuníquese con el banco.
                    </p>
                </div>
            `;
        } else if (evento.nombre === "TRANSFERENCIA_REALIZADA") {
            const montoStr = datos.monto !== undefined ? datos.monto.toFixed(2) : "0.00";
            const esCredito = datos.naturaleza === "CREDITO";

            let cuentaDestinoTexto = datos.numeroCuentaDestino;
            const idDestino = datos.destino?.cuentaId ?? datos.cuentaDestinoId;

            if (idDestino !== undefined) {
                try {
                    const cuentaDestino = await this.cuentaRepo.buscarPorId(idDestino);

                    if (cuentaDestino) {
                        cuentaDestinoTexto = cuentaDestino.obtenerNumeroCuenta().toString();
                    }
                } catch {
                    // Conservamos el número recibido en el evento.
                }
            }

            if (!cuentaDestinoTexto) {
                cuentaDestinoTexto = "No especificada";
            }

            if (esCredito) {
                asunto = "🔥 Banco Fuego - Transferencia Recibida";

                htmlContent = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #28a745; border-radius: 8px;">
                        <h2 style="color: #28a745;">🔥 Banco Fuego - Dinero Recibido</h2>
                        <p>Se ha acreditado una transferencia en su cuenta.</p>
                        <p><strong>Monto Depositado:</strong> $${montoStr}</p>
                        <p><strong>Tipo de Movimiento:</strong> Crédito recibido</p>
                        <p style="color: #666; font-size: 12px;">
                            El dinero fue depositado correctamente en su cuenta.
                        </p>
                    </div>
                `;
            } else {
                asunto = "🔥 Banco Fuego - Débito por Transferencia";

                htmlContent = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #dc3545; border-radius: 8px;">
                        <h2 style="color: #dc3545;">🔥 Banco Fuego - Transferencia Debitada</h2>
                        <p>Se ha debitado dinero de su cuenta para realizar una transferencia.</p>
                        <p><strong>Monto Debitado:</strong> $${montoStr}</p>
                        <p><strong>Cuenta Destino:</strong> ${cuentaDestinoTexto}</p>
                        <p>
                            <strong>Tipo de Transferencia:</strong>
                            ${datos.tipo === "TRANSFERENCIA_EXTERNA" ? "Interbancaria" : "Interna (Banco Fuego)"}
                        </p>
                        <p style="color: #666; font-size: 12px;">
                            Si no reconoce esta operación, comuníquese inmediatamente con el banco.
                        </p>
                    </div>
                `;
            }
        }

        await this.emailService.enviarCorreo({
            para: destinatario,
            asunto,
            html: htmlContent
        });
    }
}