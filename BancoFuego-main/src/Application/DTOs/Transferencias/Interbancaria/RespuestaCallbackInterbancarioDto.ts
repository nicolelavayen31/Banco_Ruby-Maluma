import { EstadoRespuestaInterbancaria } from "./EstadoRespuestaInterbancaria";

export interface RespuestaCallbackInterbancarioRequestDto {
    referenciaExterna: string;
    estado: EstadoRespuestaInterbancaria;
    codigoError?: string;
    mensaje?: string;
}