import bcrypt from "bcrypt";

import { IPinHasher } from "../../Domain/ValueObjects/IPinHasher";
import { PinTextoPlano } from "../../Domain/ValueObjects/PinTextoPlano";

export class PinHasherBcrypt implements IPinHasher {
    private static readonly RONDAS_SALT = 10;

    public async hashear(
        pin: PinTextoPlano
    ): Promise<string> {
        return bcrypt.hash(
            pin.valorCompleto(),
            PinHasherBcrypt.RONDAS_SALT
        );
    }

    public async verificar(
        pin: PinTextoPlano,
        hash: string
    ): Promise<boolean> {
        return bcrypt.compare(
            pin.valorCompleto(),
            hash
        );
    }
}