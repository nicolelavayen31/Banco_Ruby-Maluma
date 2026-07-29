import { TipoCuenta } from "../../Domain/Enums/TipoCuenta";

export interface CuentaResponseDto {
    id: number;
    numeroCuenta: string;
    tipo: TipoCuenta;
    saldo: number;
    activa: boolean;
}