using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // Comando MediatR para depositar efectivo en una cuenta local.
    public record DepositarCommand(string NumeroCuenta, decimal Monto) : IRequest<Result<OperacionResponse>>;
}
