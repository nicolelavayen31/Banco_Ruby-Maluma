import { IMapeoCuentaRedBancaria } from "../../../../Application/Ports/Transferencias/Interbancaria/IMapeoCuentaBancaria";

export class MapeoCuentaRedBancariaPendiente
    implements IMapeoCuentaRedBancaria {
    public async resolverAccountIdRed(
        numeroCuentaLocal: string
    ): Promise<string> {
        throw new Error(
            `No se puede resolver el account_id de la red para la cuenta ` +
            `${numeroCuentaLocal}: todavía no se completó el registro de ` +
            `BancoFuego en la red (Agreement + Accounts). Ver Fase 0/1 del ` +
            `plan de integración.`
        );
    }
}