import { SubscriberFactory } from "../../../Application/Events/SubscriberFactory";
import { AutenticacionService } from "../../../Application/Services/AutenticacionService";
import { DepositoService } from "../../../Application/Services/DepositoService";
import { HistorialService } from "../../../Application/Services/HistorialService";
import { IdempotenciaService } from "../../../Application/Services/IdempotenciaService";
import { RetiroService } from "../../../Application/Services/RetiroService";
import { TransferenciaService } from "../../../Application/Services/Transferencias/TransferenciaService";
import { TransferenciaInterbancariaService } from "../../../Application/Services/Transferencias/Interbancaria/TransferenciaInterbancariaService";
import { PrepararTransferenciaLocalService } from "../../../Application/Services/Transferencias/Local/PrepararTransferenciaLocalService";
import { TransferenciaLocalService } from "../../../Application/Services/Transferencias/Local/TransferenciaLocalService";
import { RedBancariaSimuladaClient } from "../../../Infrastructure/Clients/Transferencias/Interbancaria/RedBancariaSimuladaClient";
import { PostgresUnidadDeTrabajo } from "../../../Infrastructure/Database/PostgresUnidadDeTrabajo";
import { AutenticacionRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres";
import { ClienteRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/ClienteRepositoryPostgres";
import { CuentaRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres";
import { MovimientoRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/MovimientoRepositoryPostgres";
import { TarjetaRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres";
import { TransaccionRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/TransaccionRepositoryPostgres";
import { JwtTokenService } from "../../../Infrastructure/Security/JwtTokenService";
import { EventBus } from "../../../Shared/Events/EventBus";

export function crearServiciosTui() {

    const eventBus = new EventBus();
    SubscriberFactory.crear( eventBus );
    const tarjetaRepository = new TarjetaRepositoryPostgres();
    const autenticacionRepository =  new AutenticacionRepositoryPostgres();
    const cuentaRepository = new CuentaRepositoryPostgres();
    const clienteRepository = new ClienteRepositoryPostgres();
    const transaccionRepository = new TransaccionRepositoryPostgres();
    const movimientoRepository = new MovimientoRepositoryPostgres();
    const unidadDeTrabajo = new PostgresUnidadDeTrabajo();
    const tokenService = new JwtTokenService();
    const idempotenciaService =  new IdempotenciaService();
    const redBancariaClient = new RedBancariaSimuladaClient();
    const autenticacionService =
        new AutenticacionService(
            tarjetaRepository,
            autenticacionRepository,
            cuentaRepository,
            eventBus,
            tokenService,
            clienteRepository
        );
    const depositoService =
        new DepositoService(
            unidadDeTrabajo,
            eventBus,
            idempotenciaService
        );
    const retiroService =
        new RetiroService(
            unidadDeTrabajo,
            eventBus,
            idempotenciaService
        );
    const historialService =
        new HistorialService(
            movimientoRepository,
            transaccionRepository
        );
    const transferenciaLocalService =
        new TransferenciaLocalService(
            unidadDeTrabajo,
            idempotenciaService
        );
    const prepararTransferenciaLocalService =
        new PrepararTransferenciaLocalService(
            cuentaRepository,
            transferenciaLocalService
        );
    const transferenciaInterbancariaService =
        new TransferenciaInterbancariaService(
            unidadDeTrabajo,
            redBancariaClient,
            idempotenciaService
        );
    const transferenciaService =
        new TransferenciaService(
            prepararTransferenciaLocalService,
            transferenciaInterbancariaService,
            eventBus
        );

    return {
        cuentaRepository,
        autenticacionService,
        depositoService,
        retiroService,
        historialService,
        transferenciaService
    };
}

export type ServiciosTui = ReturnType<typeof crearServiciosTui>;