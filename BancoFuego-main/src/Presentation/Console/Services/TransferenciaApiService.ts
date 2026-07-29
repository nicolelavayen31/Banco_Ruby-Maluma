import { randomUUID } from "node:crypto";
import { BancoApiClient } from "../Clients/BancoApiClient";
import {
    ConsultaTransferenciaInterbancariaResponse, TransferenciaInterbancariaRequest,
    TransferenciaInterbancariaResponse, TransferenciaLocalRequest,
    TransferenciaLocalResponse,TransferenciaResponse
} from "../../Contracts/Api/Transferencias/TransferenciaContracts";

export class TransferenciaApiService {
    constructor(
        private readonly apiClient: BancoApiClient
    ) {}

    public transferirLocal(
        datos: Omit<
            TransferenciaLocalRequest,
            "tipoTransferencia"
        >
    ): Promise<TransferenciaLocalResponse> {
        return this.apiClient.post<
            TransferenciaLocalResponse
        >(
            "/transferencias",
            {
                tipoTransferencia: "LOCAL",
                numeroCuentaDestino: datos.numeroCuentaDestino,
                monto: datos.monto
            },
            undefined,
            this.crearHeadersIdempotencia()
        );
    }

    public transferirInterbancaria(
        datos: Omit<
            TransferenciaInterbancariaRequest,
            "tipoTransferencia"
        >
    ): Promise<TransferenciaInterbancariaResponse> {
        return this.apiClient.post<
            TransferenciaInterbancariaResponse
        >(
            "/transferencias",
            {
                tipoTransferencia: "INTERBANCARIA",
                numeroCuentaDestino: datos.numeroCuentaDestino,
                codigoBancoDestino: datos.codigoBancoDestino,
                monto: datos.monto,
                concepto: datos.concepto
            },
            undefined,
            this.crearHeadersIdempotencia()
        );
    }

    public transferir(
        datos: TransferenciaLocalRequest
    ): Promise<TransferenciaLocalResponse>;

    public transferir(
        datos: TransferenciaInterbancariaRequest
    ): Promise<TransferenciaInterbancariaResponse>;

    public transferir(
        datos:
            | TransferenciaLocalRequest
            | TransferenciaInterbancariaRequest
    ): Promise<TransferenciaResponse> {
        if (
            datos.tipoTransferencia === "LOCAL"
        ) {
            return this.transferirLocal({

                numeroCuentaDestino: datos.numeroCuentaDestino,
                monto: datos.monto
            });
        }

        return this.transferirInterbancaria({

            numeroCuentaDestino: datos.numeroCuentaDestino,
            codigoBancoDestino: datos.codigoBancoDestino,
            monto: datos.monto,
            concepto: datos.concepto
            
        });
    }

    public consultarEstadoInterbancario(
        transaccionId: number
    ): Promise<ConsultaTransferenciaInterbancariaResponse> {
        return this.apiClient.get<
            ConsultaTransferenciaInterbancariaResponse
        >(
            `/transferencias/interbancarias/${transaccionId}/estado`
        );
    }

    private crearHeadersIdempotencia():
        Record<string, string> {
        return {
            "Idempotency-Key":  randomUUID()
        };
    }
}