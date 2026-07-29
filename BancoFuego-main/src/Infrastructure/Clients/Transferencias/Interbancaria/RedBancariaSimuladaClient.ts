import {
    IRedBancariaClient,
    ResultadoTransferenciaInterbancaria,
    SolicitudTransferenciaInterbancaria
} from "../../../../Application/Ports/Transferencias/Interbancaria/IRedBancariaClient";

// Códigos de banco reservados solo para pruebas manuales.
// Cualquier otro código se comporta como el camino feliz (ACEPTADA inmediata).
const BANCO_TEST_RECHAZO_INMEDIATO = "BANCO_TEST_RECHAZO";
const BANCO_TEST_PENDIENTE_LUEGO_ACEPTA = "BANCO_TEST_PENDIENTE_ACEPTA";
const BANCO_TEST_PENDIENTE_LUEGO_RECHAZA = "BANCO_TEST_PENDIENTE_RECHAZA";
const BANCO_TEST_PENDIENTE_INDEFINIDO = "BANCO_TEST_TIMEOUT";

type EscenarioPendiente =
    | "LUEGO_ACEPTA"
    | "LUEGO_RECHAZA"
    | "INDEFINIDO";

export class RedBancariaSimuladaClient
    implements IRedBancariaClient {
    // Recuerda qué escenario le prometimos a cada referencia externa
    // para poder resolverlo en la siguiente consulta (simula polling real).
    private readonly pendientesEnCurso =
        new Map<string, EscenarioPendiente>();

    public async enviarTransferencia(
        solicitud: SolicitudTransferenciaInterbancaria
    ): Promise<ResultadoTransferenciaInterbancaria> {
        const referenciaExterna = `EXT-${Date.now()}`;

        switch (solicitud.bancoDestino) {
            case BANCO_TEST_RECHAZO_INMEDIATO:
                return {
                    estado: "RECHAZADA",
                    codigoError: "CUENTA_DESTINO_NO_EXISTE",
                    mensaje:
                        "Rechazo simulado: la cuenta destino no existe en el banco receptor."
                };

            case BANCO_TEST_PENDIENTE_LUEGO_ACEPTA:
                this.pendientesEnCurso.set(
                    referenciaExterna,
                    "LUEGO_ACEPTA"
                );
                return {
                    estado: "PENDIENTE",
                    referenciaExterna,
                    mensaje: "Transferencia en proceso en la red simulada."
                };

            case BANCO_TEST_PENDIENTE_LUEGO_RECHAZA:
                this.pendientesEnCurso.set(
                    referenciaExterna,
                    "LUEGO_RECHAZA"
                );
                return {
                    estado: "PENDIENTE",
                    referenciaExterna,
                    mensaje: "Transferencia en proceso en la red simulada."
                };

            case BANCO_TEST_PENDIENTE_INDEFINIDO:
                this.pendientesEnCurso.set(
                    referenciaExterna,
                    "INDEFINIDO"
                );
                return {
                    estado: "PENDIENTE",
                    referenciaExterna,
                    mensaje: "Transferencia en proceso en la red simulada."
                };

            default:
                // Camino feliz: cualquier banco "real"
                return {
                    estado: "ACEPTADA",
                    referenciaExterna,
                    mensaje:
                        `Transferencia aprobada hacia el banco ` +
                        solicitud.bancoDestino
                };
        }
    }

    public async consultarEstado(
        referenciaExterna: string
    ): Promise<ResultadoTransferenciaInterbancaria> {
        const escenario =
            this.pendientesEnCurso.get(referenciaExterna);

        if (!escenario || escenario === "INDEFINIDO") {
            // Sin escenario registrado, o timeout simulado:
            // sigue pendiente para siempre (útil para probar
            // el comportamiento del worker ante falta de respuesta).
            return {
                estado: "PENDIENTE",
                referenciaExterna,
                mensaje: "Transferencia aún en proceso en la red simulada."
            };
        }

        // Ya resolvemos el escenario y limpiamos el estado en memoria.
        this.pendientesEnCurso.delete(referenciaExterna);

        if (escenario === "LUEGO_ACEPTA") {
            return {
                estado: "ACEPTADA",
                referenciaExterna,
                mensaje: "Transferencia confirmada por la red simulada."
            };
        }

        return {
            estado: "RECHAZADA",
            codigoError: "RECHAZO_DIFERIDO_SIMULADO",
            mensaje: "La red simulada rechazó la transferencia tras revisión."
        };
    }
}