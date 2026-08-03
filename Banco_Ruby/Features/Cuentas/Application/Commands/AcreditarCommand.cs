using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // DTO de respuesta que contiene el resultado descriptivo de la operaciÃ³n bancaria y el saldo disponible actualizado.
    public record OperacionResponse(string Mensaje, decimal SaldoActual);

    // Comando MediatR que solicita acreditar fondos en una cuenta bancaria (por depÃ³sito local o transferencia interbancaria).
    public record AcreditarCommand(
        string NumeroCuentaDestino, 
        decimal Monto, 
        string? CuentaOrigen, 
        string? BancoOrigen, 
        string? Concepto
    ) : IRequest<Result<OperacionResponse>>;
}
