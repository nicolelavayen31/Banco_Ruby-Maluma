import { TransferenciaLocalResponseDto } from "../../../DTOs/Transferencias/Local/TransferenciaLocalDto";
import { ICuentaRepository } from "../../../Ports/ICuentaRepository";
import { CuentaNoEncontradaError } from "../../../../Domain/Errors/DomainErrors";
import { TransferenciaLocalService } from "./TransferenciaLocalService";

export interface PrepararTransferenciaLocalRequest {
    cuentaOrigenId: number;
    numeroCuentaDestino: string;
    monto: number;
    idempotencyKey?: string;
    correoCliente?: string;
}

export interface ResultadoPrepararTransferenciaLocal {
    respuesta: TransferenciaLocalResponseDto;
    operacionNueva: boolean;
}

export class PrepararTransferenciaLocalService {
    constructor(

        private readonly cuentaRepository: ICuentaRepository,
        private readonly transferenciaLocalService: TransferenciaLocalService
    ) {}

    public async ejecutar(
        datos: PrepararTransferenciaLocalRequest
    ): Promise<ResultadoPrepararTransferenciaLocal> {
        const numeroCuentaDestino = datos.numeroCuentaDestino.trim();
        const cuentaDestino =
            await this.cuentaRepository
                .buscarPorNumeroCuentaParaActualizar(
                    numeroCuentaDestino
                );
        const cuentaDestinoId = cuentaDestino?.obtenerId();
        if (
            !cuentaDestino ||
            cuentaDestinoId === undefined
        ) {
            throw new CuentaNoEncontradaError(
                "No se encontró la cuenta destino."
            );
        }

        return this.transferenciaLocalService.ejecutar({
            
            cuentaOrigenId: datos.cuentaOrigenId,
            cuentaDestinoId,
            monto: datos.monto,
            idempotencyKey: datos.idempotencyKey,
            correoCliente: datos.correoCliente
        });
    }
}