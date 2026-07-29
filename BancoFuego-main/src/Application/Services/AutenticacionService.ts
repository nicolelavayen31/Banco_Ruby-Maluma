import { AutenticacionRequestDto, AutenticacionResponseDto } from "../DTOs/AutenticacionDto";
import { TiposEvento } from "../Events/TiposEvento";
import { IAutenticacionRepository } from "../Ports/IAutenticacionRepository";
import { ICuentaRepository } from "../Ports/ICuentaRepository";
import { ITarjetaRepository } from "../Ports/ITarjetaRepository";
import { AutenticacionNoEncontradaError, CuentaNoEncontradaError, PinIncorrectoError, TarjetaBloqueadaError, TarjetaNoEncontradaError } from "../../Domain/Errors/DomainErrors";

import { NumeroTarjeta } from "../../Domain/ValueObjects/NumeroTarjeta";
import { PinTextoPlano } from "../../Domain/ValueObjects/PinTextoPlano";
import { EventBus } from "../../Shared/Events/EventBus";
import { Evento } from "../../Shared/Events/Evento";
import { ITokenService } from "../Ports/ITokenService";


import { IClienteRepository } from "../Ports/IClienteRepository";

export class AutenticacionService {
    constructor(
        private readonly tarjetaRepository: ITarjetaRepository,
        private readonly autenticacionRepository: IAutenticacionRepository,
        private readonly cuentaRepository: ICuentaRepository,
        private readonly eventBus: EventBus,
        private readonly tokenService: ITokenService,
        private readonly clienteRepository?: IClienteRepository
    ) {}


    public async autenticar(datos: AutenticacionRequestDto
    ): Promise<AutenticacionResponseDto> {
        const numeroTarjeta =
            NumeroTarjeta.desde(
                datos.numeroTarjeta
            );

        const tarjeta =
            await this.tarjetaRepository
                .buscarPorNumero(
                    numeroTarjeta
                );

        if (!tarjeta) {
            throw new TarjetaNoEncontradaError();
        }

        tarjeta.asegurarUsable();

        const tarjetaId =
            tarjeta.obtenerId();

        if (tarjetaId === undefined) {
            throw new Error(
                "La tarjeta recuperada no contiene identificador"
            );
        }

        const autenticacion =
            await this.autenticacionRepository
                .buscarPorTarjetaId(
                    tarjetaId
                );

        if (!autenticacion) {
            throw new AutenticacionNoEncontradaError();
        }

        const pin =
            PinTextoPlano.desde(
                datos.pin
            );

        const pinCorrecto =
            await autenticacion.verificarPin(pin);

        await this.autenticacionRepository
            .actualizar(
                autenticacion
            );

        if (!pinCorrecto) {
            if (autenticacion.estaBloqueado()) {
                throw new TarjetaBloqueadaError("La tarjeta ha sido bloqueada por acumular 3 intentos fallidos de PIN.");
            }
            const restantes = Math.max(0, 3 - autenticacion.obtenerIntentos());
            throw new PinIncorrectoError(
                `PIN incorrecto. Te queda${restantes === 1 ? '' : 'n'} ${restantes} intento${restantes === 1 ? '' : 's'} antes del bloqueo.`
            );
        }

        const cuenta =
            await this.cuentaRepository
                .buscarPorId(
                    tarjeta.obtenerIdCuenta()
                );

        if (!cuenta) {
            throw new CuentaNoEncontradaError();
        }

        const cuentaId =
            cuenta.obtenerId();

        if (cuentaId === undefined) {
            throw new Error(
                "La cuenta recuperada no contiene identificador"
            );
        }

        const numeroCuenta =
            cuenta
                .obtenerNumeroCuenta()
                .toString();

        const token =
            this.tokenService.generar({
                cuentaId,
                numeroCuenta
            });

        let nombreCliente: string | undefined;
        let correoCliente: string | undefined;

        if (this.clienteRepository && cuenta.obtenerIdCliente()) {
            try {
                const cliente = await this.clienteRepository.buscarPorId(cuenta.obtenerIdCliente());
                if (cliente) {
                    nombreCliente = cliente.nombreCompleto();
                    correoCliente = cliente.obtenerCorreo();
                }
            } catch {
                // Si falla la consulta del cliente, se entrega la respuesta básica
            }
        }

        const respuesta: AutenticacionResponseDto = {
            token,
            cuentaId,
            numeroCuenta,
            saldo: cuenta.obtenerSaldo().toNumber(),
            nombreCliente,
            correoCliente
        };


        this.eventBus.publicar(
            new Evento(
                TiposEvento.LOGIN_REALIZADO,
                {
                    cuentaId,
                    numeroCuenta: respuesta.numeroCuenta
                }
            )
        );

        return respuesta;
    }

    public async cambiarPin(datos: {
        numeroTarjeta: string;
        pinActual: string;
        pinNuevo: string;
    }): Promise<void> {
        const numeroTarjeta = NumeroTarjeta.desde(datos.numeroTarjeta);
        const tarjeta = await this.tarjetaRepository.buscarPorNumero(numeroTarjeta);

        if (!tarjeta) {
            throw new TarjetaNoEncontradaError();
        }

        tarjeta.asegurarUsable();

        const tarjetaId = tarjeta.obtenerId();
        if (tarjetaId === undefined) {
            throw new Error("La tarjeta recuperada no contiene identificador");
        }

        const autenticacion = await this.autenticacionRepository.buscarPorTarjetaId(tarjetaId);
        if (!autenticacion) {
            throw new AutenticacionNoEncontradaError();
        }

        const pinActual = PinTextoPlano.desde(datos.pinActual);
        const pinCorrecto = await autenticacion.verificarPin(pinActual);
        await this.autenticacionRepository.actualizar(autenticacion);

        if (!pinCorrecto) {
            if (autenticacion.estaBloqueado()) {
                throw new TarjetaBloqueadaError("La tarjeta ha sido bloqueada por acumular 3 intentos fallidos de PIN.");
            }
            const restantes = Math.max(0, 3 - autenticacion.obtenerIntentos());
            throw new PinIncorrectoError(
                `PIN actual incorrecto. Te queda${restantes === 1 ? '' : 'n'} ${restantes} intento${restantes === 1 ? '' : 's'} antes del bloqueo.`
            );
        }

        const pinNuevo = PinTextoPlano.desde(datos.pinNuevo);
        await autenticacion.cambiarPin(pinNuevo);
        await this.autenticacionRepository.actualizar(autenticacion);
    }
}