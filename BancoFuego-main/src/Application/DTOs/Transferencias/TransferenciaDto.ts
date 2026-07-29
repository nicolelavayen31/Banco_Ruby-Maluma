import { TransferenciaLocalRequestDto, TransferenciaLocalResponseDto } from "./Local/TransferenciaLocalDto";
import { TransferenciaInterbancariaRequestDto, TransferenciaInterbancariaResponseDto } from "./Interbancaria/TransferenciaInterbancariaDto";

export type TransferenciaRequestDto =
    | ({
        tipoTransferencia: "LOCAL";
    } & TransferenciaLocalRequestDto)
    | ({
        tipoTransferencia: "INTERBANCARIA";
    } & TransferenciaInterbancariaRequestDto);

export type TransferenciaResponseDto =
    | TransferenciaLocalResponseDto
    | TransferenciaInterbancariaResponseDto;