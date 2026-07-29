import {
    TransferenciaInterbancariaEstadoService
} from "../../../../Application/Services/Transferencias/Interbancaria/TransferenciaInterbancariaEstadoService";
import logger from "../../../../Shared/Logging/Logger";

export class TransferenciaInterbancariaPollingWorker {
    private temporizador: NodeJS.Timeout | null = null;
    private ejecutando = false;

    constructor(
        private readonly estadoService:
            TransferenciaInterbancariaEstadoService,

        private readonly intervaloMs: number = 30_000,

        private readonly loteMaximo: number = 50
    ) {}

    public iniciar(): void {
        if (this.temporizador) {
            return;
        }

        this.temporizador = setInterval(
            () => {
                void this.ejecutarCiclo();
            },
            this.intervaloMs
        );

        logger.info(
            `Worker interbancario iniciado cada ${this.intervaloMs} ms.`
        );
    }

    public detener(): void {
        if (!this.temporizador) {
            return;
        }

        clearInterval(this.temporizador);
        this.temporizador = null;

        logger.info(
            "Worker interbancario detenido."
        );
    }

    public async ejecutarCiclo(): Promise<void> {
        /*
         * Evita ciclos superpuestos cuando una consulta tarda
         * más tiempo que el intervalo configurado.
         */
        if (this.ejecutando) {
            return;
        }

        this.ejecutando = true;

        try {
            const actualizadas =
                await this.estadoService
                    .sincronizarPendientes(
                        this.loteMaximo
                    );

            if (actualizadas > 0) {
                logger.info(
                    `Se actualizaron ${actualizadas} transferencia(s) interbancaria(s).`
                );
            }
        } catch (error) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : String(error);

            logger.warn(
                `Error en el worker interbancario: ${mensaje}`
            );
        } finally {
            this.ejecutando = false;
        }
    }
}