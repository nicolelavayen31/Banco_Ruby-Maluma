import { PinTextoPlano } from "./PinTextoPlano";

export interface IPinHasher {
    hashear(pin: PinTextoPlano): Promise<string>;

    verificar(
        pin: PinTextoPlano,
        hash: string
    ): Promise<boolean>;
}