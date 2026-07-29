import nodemailer from "nodemailer";
import logger from "../../Shared/Logging/Logger";

export interface OpcionesCorreo {
    para: string;
    asunto: string;
    html: string;
    texto?: string;
}

export class NodemailerEmailService {
    private transporter:
    nodemailer.Transporter | null = null;

    constructor() {
        this.inicializar();
    }

    private inicializar(): void {

        const host = process.env.SMTP_HOST;
        const port =
            parseInt(
                process.env.SMTP_PORT ??
                    "587",
                10
            );

        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (
            !host ||
            !user ||
            !pass ||
            user === "tu_correo@gmail.com" ||
            pass === "tu_contrasena_de_aplicacion"
        ) {
            logger.warn(
                "[SMTP] Credenciales SMTP no configuradas o en valores por defecto. Los correos se simularán en el log."
            );
            return;
        }

        this.transporter =
            nodemailer.createTransport({
                host,
                port,
                secure:
                    process.env.SMTP_SECURE === "true" ||
                    port === 465,
                auth: {
                    user,
                    pass
                }
            });
    }

    public async enviarCorreo(
        opciones: OpcionesCorreo
    ): Promise<boolean> {
        if (!this.transporter) {
            logger.info(
                `[CORREO SIMULADO] Para: ${opciones.para} | Asunto: ${opciones.asunto}`
            );
            return false;
        }

        try {
            const remitente =
                process.env.SMTP_FROM ??
                '"Banco Fuego" <notificaciones@bancofuego.com>';

            const info =
                await this.transporter.sendMail({
                    from: remitente,
                    to: opciones.para,
                    subject: opciones.asunto,
                    text:
                        opciones.texto ??
                        opciones.asunto,
                    html: opciones.html
                });

            logger.info( `[CORREO ENVIADO] ID: ${info.messageId} -> Para: ${opciones.para}`);
            return true;
        } catch (error: unknown) {
            const mensaje =
                error instanceof Error
                ? error.message
                : String(error);

            logger.error( `[CORREO ERROR] No se pudo enviar el correo a ${opciones.para}: ${mensaje}`);
            return false;
        }
    }
}