using FluentResults;
using MediatR;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    public record OperacionResponse(string Mensaje, decimal SaldoActual);

    public record AcreditarCommand(string NumeroCuentaDestino, decimal Monto, string? CuentaOrigen, string? BancoOrigen, string? Concepto) : IRequest<Result<OperacionResponse>>;
}
