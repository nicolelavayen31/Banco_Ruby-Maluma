using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// DTO de respuesta que contiene el resultado descriptivo de la operación bancaria y el saldo disponible actualizado.
    /// </summary>
    public record OperacionResponse(string Mensaje, decimal SaldoActual);

    /// <summary>
    /// Comando MediatR que solicita acreditar fondos en una cuenta bancaria (por depósito local o transferencia interbancaria).
    /// </summary>
    public record AcreditarCommand(
        string NumeroCuentaDestino, 
        decimal Monto, 
        string? CuentaOrigen, 
        string? BancoOrigen, 
        string? Concepto
    ) : IRequest<Result<OperacionResponse>>;
}
