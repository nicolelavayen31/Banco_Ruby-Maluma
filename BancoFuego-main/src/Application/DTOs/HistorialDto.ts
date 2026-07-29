import { EstadoTransaccion } from "../../Domain/Enums/EstadoTransaccion";
import { TipoTransaccion } from "../../Domain/Enums/TipoTransaccion";
import { NaturalezaMovimiento } from "../../Domain/Enums/NaturalezaMovimiento";

export interface HistorialItemDto {
    movimientoId: number;
    transaccionId: number;
    tipo: TipoTransaccion;
    monto: number;
    estado: EstadoTransaccion;
    fecha: Date;
    naturaleza?: NaturalezaMovimiento;
    saldoAnterior: number;
    saldoPosterior: number;
}