using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Comando MediatR para depositar efectivo en una cuenta local.
    /// </summary>
    public record DepositarCommand(string NumeroCuenta, decimal Monto) : IRequest<Result<OperacionResponse>>;
}
