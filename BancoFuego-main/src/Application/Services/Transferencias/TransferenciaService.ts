import { TransferenciaLocalResponseDto } from "../../DTOs/Transferencias/Local/TransferenciaLocalDto";
import { TransferenciaInterbancariaResponseDto} from "../../DTOs/Transferencias/Interbancaria/TransferenciaInterbancariaDto";
import { TiposEvento } from "../../Events/TiposEvento";
import { PrepararTransferenciaLocalService} from "./Local/PrepararTransferenciaLocalService";
import { TransferenciaInterbancariaService } from "./Interbancaria/TransferenciaInterbancariaService";
import { EventBus } from "../../../Shared/Events/EventBus";
import { Evento } from "../../../Shared/Events/Evento";

export type EjecutarTransferenciaRequest =
    | {
        tipoTransferencia: "LOCAL";
        cuentaOrigenId: number;
        numeroCuentaDestino: string;
        monto: number;
        idempotencyKey?: string;
        correoCliente?: string;
    }
    | {
        tipoTransferencia: "INTERBANCARIA";
        cuentaOrigenId: number;
        numeroCuentaDestino: string;
        codigoBancoDestino: string;
        monto: number;
        concepto?: string;
        idempotencyKey?: string;
        correoCliente?: string;
    };

export type EjecutarTransferenciaResponse =
    | TransferenciaLocalResponseDto
    | TransferenciaInterbancariaResponseDto;

export class TransferenciaService {
    constructor(

        private readonly prepararTransferenciaLocalService: PrepararTransferenciaLocalService,
        private readonly transferenciaInterbancariaService: TransferenciaInterbancariaService,
        private readonly eventBus: EventBus
    ) {}

    public async ejecutar(
        datos: EjecutarTransferenciaRequest
    ): Promise<EjecutarTransferenciaResponse> {
        const resultado =
            datos.tipoTransferencia === "LOCAL"
                ? await this.prepararTransferenciaLocalService.ejecutar({
                    
                    cuentaOrigenId: datos.cuentaOrigenId,
                    numeroCuentaDestino: datos.numeroCuentaDestino,
                    monto: datos.monto,
                    idempotencyKey:datos.idempotencyKey,
                    correoCliente: datos.correoCliente
                })
                : await this.transferenciaInterbancariaService.ejecutar({
                    
                    cuentaOrigenId: datos.cuentaOrigenId,
                    numeroCuentaDestino: datos.numeroCuentaDestino,
                    codigoBancoDestino: datos.codigoBancoDestino,
                    monto: datos.monto,
                    concepto: datos.concepto,
                    idempotencyKey: datos.idempotencyKey,
                    correoCliente: datos.correoCliente
                });

        /*
         * No publicamos nuevamente el evento cuando la respuesta
         * proviene de una petición idempotente repetida.
         */
        if (resultado.operacionNueva) {
            this.eventBus.publicar(
                new Evento(TiposEvento.TRANSFERENCIA_REALIZADA, {
                    ...resultado.respuesta,
                    naturaleza: "DEBITO",
                    cuentaId: datos.cuentaOrigenId,
                    monto: datos.monto,
                    correoCliente: datos.correoCliente,
                    numeroCuentaDestino: datos.numeroCuentaDestino
                })
            );

            if (datos.tipoTransferencia === "LOCAL" && resultado.respuesta.tipo === "TRANSFERENCIA_INTERNA") {
                this.eventBus.publicar(
                    new Evento(TiposEvento.TRANSFERENCIA_REALIZADA, {
                        naturaleza: "CREDITO",
                        cuentaId: resultado.respuesta.destino.cuentaId,
                        cuentaDestinoId: resultado.respuesta.destino.cuentaId,
                        monto: datos.monto,
                        tipo: resultado.respuesta.tipo
                    })
                );
            }
        }

        return resultado.respuesta;
    }
}