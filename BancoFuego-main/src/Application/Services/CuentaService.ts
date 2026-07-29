import { CuentaResponseDto } from "../DTOs/CuentaDto";
import { ICuentaRepository } from "../Ports/ICuentaRepository";
import { CuentaNoEncontradaError } from "../../Domain/Errors/DomainErrors";

export class CuentaService {
    constructor(
        private readonly cuentaRepository: ICuentaRepository
    ) {}

    public async obtenerPorId(
        id: number
    ): Promise<CuentaResponseDto> {
        const cuenta =
            await this.cuentaRepository.buscarPorId(id);

        if (!cuenta) {
            throw new CuentaNoEncontradaError();
        }

        const cuentaId = cuenta.obtenerId();

        if (cuentaId === undefined) {
            throw new Error(
                "La cuenta recuperada no contiene un identificador"
            );
        }

        return {
            id: cuentaId,
            numeroCuenta:
                cuenta.obtenerNumeroCuenta().toString(),
            tipo: cuenta.obtenerTipo(),
            saldo: cuenta.obtenerSaldo().toNumber(),
            activa: cuenta.estaActiva()
        };
    }
}