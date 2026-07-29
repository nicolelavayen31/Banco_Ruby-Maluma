import "dotenv/config";
import { app } from "./app";
import { transferenciaInterbancariaPollingWorker } from "../../Bootstrap/CompositionRoot";
import { PostgresConnection } from "../../Infrastructure/Database/PostgresConnection";
import logger from "../../Shared/Logging/Logger";

const puerto =
    Number(
        process.env.PORT ?? 3000
    );

const pollingHabilitado =
    (
        process.env.INTERBANK_POLLING_ENABLED ??
        "true"
    ).toLowerCase() === "true";

async function iniciarServidor():
    Promise<void> {
    try {
        await PostgresConnection
            .verificarConexion();

        const servidor =
            app.listen(
                puerto,
                () => {
                    logger.info(
                        `API BancoFuego ejecutándose en el puerto ${puerto}`
                    );

                    if (pollingHabilitado) {
                        transferenciaInterbancariaPollingWorker
                            .iniciar();
                    }
                }
            );

        const cerrarServidor = (
            señal: string
        ): void => {
            logger.info(
                `Se recibió ${señal}. Cerrando BancoFuego...`
            );

            transferenciaInterbancariaPollingWorker
                .detener();

            servidor.close(
                () => {
                    logger.info(
                        "Servidor HTTP detenido."
                    );

                    process.exitCode = 0;
                }
            );
        };

        process.once(
            "SIGINT",
            () => cerrarServidor("SIGINT")
        );

        process.once(
            "SIGTERM",
            () => cerrarServidor("SIGTERM")
        );
    } catch (error) {
        const mensaje =
            error instanceof Error
                ? error.message
                : "Error desconocido";

        logger.error(
            `No fue posible iniciar la API: ${mensaje}`
        );

        process.exitCode = 1;
    }
}

void iniciarServidor();